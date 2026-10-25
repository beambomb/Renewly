"use client";

import { useActionState, useState } from "react";
import { strings } from "@/lib/strings";
import { AuthField, AuthMessage, PasswordToggle } from "../../_components/auth-field";
import { signIn, type SignInState } from "../actions";

const INITIAL: SignInState = { status: "idle" };

export function SignInForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);
  const [showPassword, setShowPassword] = useState(false);

  const error = state.status === "error" ? state : undefined;
  const message = error?.message ?? (linkError ? strings.auth.linkFailed : undefined);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {message ? <AuthMessage>{message}</AuthMessage> : null}

      <AuthField
        id="email"
        label={strings.auth.emailLabel}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        defaultValue={error?.email ?? ""}
        error={error?.emailError}
      />

      <AuthField
        id="password"
        label={strings.auth.passwordLabel}
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={error?.passwordError}
        trailing={<PasswordToggle visible={showPassword} controls="password" onToggle={() => setShowPassword((v) => !v)} />}
      />

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md bg-primary px-6 font-medium text-on-primary transition-opacity duration-[var(--duration-press)] hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? strings.auth.submitting : strings.auth.submit}
      </button>
    </form>
  );
}
