"use server";

import { redirect } from "next/navigation";
import { classifyAuthFailure, messageForFailure } from "@/lib/auth/errors";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { signInSchema } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import { strings } from "@/lib/strings";

/** Never carries the password. */
export type SignInState =
  | { status: "idle" }
  | { status: "error"; email: string; emailError?: string; passwordError?: string; message?: string };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

/** Signs in with email and password. Never logs the email, password or tokens. */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const rawEmail = text(formData.get("email"));
  const rawNext = text(formData.get("next"));
  const parsed = signInSchema.safeParse({
    email: rawEmail,
    password: text(formData.get("password")),
    next: rawNext || undefined,
  });

  if (!parsed.success) {
    const paths = new Set(parsed.error.issues.map((issue) => issue.path[0]));
    const state: SignInState = { status: "error", email: rawEmail.slice(0, 254) };
    if (paths.has("email")) state.emailError = strings.auth.invalidEmail;
    if (paths.has("password")) state.passwordError = strings.auth.passwordRequired;
    return state;
  }

  const { email, password } = parsed.data;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const kind = classifyAuthFailure({ code: error.code, status: error.status });
      // Code and status only: never the address, password or message text.
      console.error("password sign-in failed", { kind, code: error.code, status: error.status });
      return { status: "error", email, message: messageForFailure(kind) };
    }
  } catch {
    console.error("password sign-in failed", { kind: "unreachable" });
    return { status: "error", email, message: messageForFailure("unreachable") };
  }

  // Outside try/catch: redirect() works by throwing.
  redirect(safeRedirectPath(parsed.data.next));
}
