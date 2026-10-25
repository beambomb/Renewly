"use client";

import { useActionState, useState, type FormEvent } from "react";
import Link from "next/link";
import { validateSignUp, type SignUpFieldErrors } from "@/lib/auth/sign-up-validation";
import { strings } from "@/lib/strings";
import { AuthField, AuthMessage, PasswordToggle } from "../../_components/auth-field";
import { signUp, type SignUpState } from "../actions";

const INITIAL: SignUpState = { status: "idle" };

function field(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<SignUpFieldErrors>();

  const error = state.status === "error" ? state : undefined;
  const errors = clientErrors ?? error?.fieldErrors;

  // Catch typos before the round trip; the server action validates again.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const result = validateSignUp({
      email: field(data, "email"),
      password: field(data, "password"),
      confirmPassword: field(data, "confirmPassword"),
    });
    if (result.ok) {
      setClientErrors(undefined);
      return;
    }
    event.preventDefault();
    setClientErrors(result.errors);
  }

  if (state.status === "check-email") {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 text-card-foreground">
        <p className="font-medium">{strings.auth.checkInbox}</p>
        <Link href="/sign-in" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
          {strings.auth.goToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {error?.message ? (
        <AuthMessage>
          {error.message}
          {error.accountExists ? (
            <>
              {" "}
              <Link href="/sign-in" className="inline-flex min-h-11 items-center font-medium underline underline-offset-4">
                {strings.auth.goToSignIn}
              </Link>
            </>
          ) : null}
        </AuthMessage>
      ) : null}

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
        error={errors?.email}
      />

      <AuthField
        id="password"
        label={strings.auth.passwordLabel}
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        autoCapitalize="none"
        spellCheck={false}
        required
        hint={strings.auth.passwordHint}
        error={errors?.password}
        trailing={
          <PasswordToggle visible={showPassword} controls="password confirmPassword" onToggle={() => setShowPassword((v) => !v)} />
        }
      />

      <AuthField
        id="confirmPassword"
        label={strings.auth.confirmPasswordLabel}
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        autoCapitalize="none"
        spellCheck={false}
        required
        error={errors?.confirmPassword}
      />

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md bg-primary px-6 font-medium text-on-primary transition-opacity duration-[var(--duration-press)] hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? strings.auth.signUpSubmitting : strings.auth.signUpSubmit}
      </button>
    </form>
  );
}
