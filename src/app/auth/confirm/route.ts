import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { confirmParamsSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Finishes a magic-link sign-in from a token hash. Unlike the PKCE callback this
 * works when the email app opens the link in a different browser, which is
 * common on phones. Needs the email template to link here (see README).
 */
export async function GET(request: NextRequest) {
  const params = confirmParamsSchema.safeParse({
    token_hash: request.nextUrl.searchParams.get("token_hash") ?? "",
    type: request.nextUrl.searchParams.get("type") ?? "",
    next: request.nextUrl.searchParams.get("next") ?? undefined,
  });
  const failure = NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  failure.headers.set("cache-control", "private, no-store");
  if (!params.success) return failure;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: params.data.type,
      token_hash: params.data.token_hash,
    });
    if (error) return failure;
  } catch {
    return failure;
  }

  const success = NextResponse.redirect(new URL(safeRedirectPath(params.data.next), request.url));
  success.headers.set("cache-control", "private, no-store");
  return success;
}
