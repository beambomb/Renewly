import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { callbackParamsSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";

/** Finishes a PKCE magic-link sign-in (the link must be opened in the same browser). */
export async function GET(request: NextRequest) {
  const params = callbackParamsSchema.safeParse({
    code: request.nextUrl.searchParams.get("code") ?? "",
    next: request.nextUrl.searchParams.get("next") ?? undefined,
  });
  const failure = NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  failure.headers.set("cache-control", "private, no-store");
  if (!params.success) return failure;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(params.data.code);
    if (error) return failure;
  } catch {
    return failure;
  }

  const success = NextResponse.redirect(new URL(safeRedirectPath(params.data.next), request.url));
  success.headers.set("cache-control", "private, no-store");
  return success;
}
