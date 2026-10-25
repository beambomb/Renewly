import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decideAccess } from "@/lib/auth/access";
import { readPublicEnv } from "@/lib/env";

const UNCONFIGURED_MESSAGE =
  "Renewly is not configured. Copy .env.example to .env.local and set the Supabase variables.";

/**
 * Refreshes the Supabase session cookies for a request and enforces sign-in.
 * Called from src/proxy.ts. Auth cookie responses are never cacheable.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const isDevelopment = process.env.NODE_ENV !== "production";
  const envResult = readPublicEnv();

  if (!envResult.ok) {
    const decision = decideAccess({
      pathname,
      search,
      method: request.method,
      isAuthenticated: false,
      supabaseConfigured: false,
      isDevelopment,
    });
    if (decision.type === "allow") return NextResponse.next({ request });
    return new NextResponse(UNCONFIGURED_MESSAGE, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  let response = NextResponse.next({ request });
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } = envResult.env;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [headerName, headerValue] of Object.entries(headers)) {
          response.headers.set(headerName, headerValue);
        }
      },
    },
  });

  // getClaims validates the token signature, so a forged cookie is not accepted.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const decision = decideAccess({
    pathname,
    search,
    method: request.method,
    isAuthenticated,
    supabaseConfigured: true,
    isDevelopment,
  });

  if (decision.type === "rewrite") {
    const rewrite = NextResponse.rewrite(new URL(decision.location, request.url), { request });
    // Same URL serves two documents depending on the cookie, so no shared cache may keep it.
    for (const cookie of response.cookies.getAll()) rewrite.cookies.set(cookie);
    rewrite.headers.set("cache-control", "private, no-store");
    return rewrite;
  }

  if (decision.type === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.location, request.url));
    // Carry refreshed session cookies over to the redirect response.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("cache-control", "private, no-store");
    return redirect;
  }

  return response;
}
