"use server";

import { redirect } from "next/navigation";
import { classifyAuthFailure, messageForFailure } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { validateSignUp, type SignUpFieldErrors } from "@/lib/auth/sign-up-validation";
import { createClient } from "@/lib/supabase/server";

/** Never carries a password. */
export type SignUpState =
  | { status: "idle" }
  | { status: "error"; email: string; fieldErrors?: SignUpFieldErrors; message?: string; accountExists?: boolean }
  | { status: "check-email"; email: string };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/** Creates an account with email and password. Never logs the email, password or tokens. */
export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const rawEmail = text(formData.get("email"));
  const rawNext = text(formData.get("next"));
  const validation = validateSignUp({
    email: rawEmail,
    password: text(formData.get("password")),
    confirmPassword: text(formData.get("confirmPassword")),
    next: rawNext || undefined,
  });

  if (!validation.ok) {
    return { status: "error", email: rawEmail.slice(0, 254), fieldErrors: validation.errors };
  }

  const { email, password } = validation.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const kind = classifyAuthFailure({ code: error.code, status: error.status });
      // Code and status only: never the address, password or message text.
      console.error("sign-up failed", { kind, code: error.code, status: error.status });
      return { status: "error", email, message: messageForFailure(kind), accountExists: kind === "email_exists" };
    }
    // No session means the project still requires email confirmation.
    if (!data.session) return { status: "check-email", email };
  } catch {
    console.error("sign-up failed", { kind: "unreachable" });
    return { status: "error", email, message: messageForFailure("unreachable") };
  }

  // Outside try/catch: redirect() works by throwing.
  redirect(safeRedirectPath(validation.data.next));
}
