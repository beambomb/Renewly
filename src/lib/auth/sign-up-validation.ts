import { signUpSchema, type SignUpInput } from "@/lib/schemas/auth";
import { strings } from "@/lib/strings";

export interface SignUpFieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export type SignUpValidation = { ok: true; data: SignUpInput } | { ok: false; errors: SignUpFieldErrors };

/** One place that turns schema issues into field messages, used by the form and the server action. */
export function validateSignUp(raw: {
  email: string;
  password: string;
  confirmPassword: string;
  next?: string | undefined;
}): SignUpValidation {
  const parsed = signUpSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };

  const errors: SignUpFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (field === "email") errors.email ??= strings.auth.invalidEmail;
    else if (field === "password") {
      errors.password ??= issue.code === "too_big" ? strings.auth.passwordTooLong : strings.auth.passwordTooShort;
    } else if (field === "confirmPassword") errors.confirmPassword ??= strings.auth.passwordMismatch;
  }
  return { ok: false, errors };
}
