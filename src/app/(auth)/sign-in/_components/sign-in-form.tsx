"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { strings } from "@/lib/strings";
import { requestMagicLink, type SignInState } from "../actions";

const INITIAL: SignInState = { status: "idle" };

export function SignInForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [state, formAction, pending] = useActionState(requestMagicLink, INITIAL);

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <Mail aria-hidden="true" size={24} className="text-secondary" />
        <h2 className="mt-3 text-xl font-semibold">{strings.auth.sentTitle}</h2>
        <p className="mt-2 text-muted-foreground">{strings.auth.sentBody(state.email)}</p>
      </div>
    );
  }

  const fieldError = state.status === "error" ? state.fieldError : undefined;
  const message = state.status === "error" ? state.message : linkError ? strings.auth.linkFailed : undefined;
  const email = state.status === "error" ? state.email : "";

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
          defaultValue={email}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "email-hint email-error" : "email-hint"}
          className="min-h-11 rounded-md border border-muted-foreground bg-card px-3 text-card-foreground"
        />
        <p id="email-hint" className="text-sm text-muted-foreground">
          {strings.auth.emailHint}
        </p>
        {fieldError ? (
          <p id="email-error" role="alert" className="text-sm font-medium text-destructive">
            {fieldError}
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
