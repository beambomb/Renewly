"use server";

import { getPublicEnv } from "@/lib/env";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { signInSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { strings } from "@/lib/strings";

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; email: string; fieldError?: string; message?: string };

/** Sends a magic link. Never logs the email address or any token. */
export async function requestMagicLink(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const rawEmail = formData.get("email");
  const rawNext = formData.get("next");
  const parsed = signInSchema.safeParse({
    email: typeof rawEmail === "string" ? rawEmail : "",
    next: typeof rawNext === "string" && rawNext ? rawNext : undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      email: typeof rawEmail === "string" ? rawEmail.slice(0, 254) : "",
      fieldError: strings.auth.invalidEmail,
    };
  }

  const { email } = parsed.data;
  const next = safeRedirectPath(parsed.data.next);

  try {
    const supabase = await createClient();
    const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) return { status: "error", email, message: strings.auth.sendFailed };
  } catch {
    return { status: "error", email, message: strings.auth.sendFailed };
  }

  return { status: "sent", email };
}
