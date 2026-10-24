"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { strings } from "@/lib/strings";
import { signIn, type SignInState } from "../actions";

const INITIAL: SignInState = { status: "idle" };

const INPUT = "min-h-11 w-full rounded-md border border-muted-foreground bg-card text-card-foreground";

export function SignInForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);
  const [showPassword, setShowPassword] = useState(false);

  const error = state.status === "error" ? state : undefined;
  const message = error?.message ?? (linkError ? strings.auth.linkFailed : undefined);
  const emailError = error?.emailError;
  const passwordError = error?.passwordError;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {message ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-medium text-foreground">
          {strings.auth.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={error?.email ?? ""}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={`${INPUT} px-3`}
        />
        {emailError ? (
          <p id="email-error" role="alert" className="text-sm font-medium text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="font-medium text-foreground">
          {strings.auth.passwordLabel}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={`${INPUT} pl-3 pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-controls="password"
            aria-label={showPassword ? strings.auth.hidePassword : strings.auth.showPassword}
            className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground"
          >
            {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
          </button>
        </div>
        {passwordError ? (
          <p id="password-error" role="alert" className="text-sm font-medium text-destructive">
            {passwordError}
          </p>
        ) : null}
      </div>

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
