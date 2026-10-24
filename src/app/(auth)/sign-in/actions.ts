"use server";

import { headers } from "next/headers";
import { classifyAuthFailure, messageForFailure } from "@/lib/auth/errors";
import { originFromHeaders } from "@/lib/request-origin";
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
    // The link comes back to wherever the app is running; no extra setting needed.
    const requestHeaders = await headers();
    const origin = originFromHeaders({
      host: requestHeaders.get("host"),
      forwardedHost: requestHeaders.get("x-forwarded-host"),
      forwardedProto: requestHeaders.get("x-forwarded-proto"),
    });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: origin ? { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` } : {},
    });
    if (error) {
      const kind = classifyAuthFailure({ code: error.code, status: error.status });
      // Code and status only: never the address, token or message text.
      console.error("magic link failed", { kind, code: error.code, status: error.status });
      return { status: "error", email, message: messageForFailure(kind) };
    }
  } catch {
    console.error("magic link failed", { kind: "unreachable" });
    return { status: "error", email, message: messageForFailure("unreachable") };
  }

  return { status: "sent", email };
}
