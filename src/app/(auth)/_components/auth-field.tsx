import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { strings } from "@/lib/strings";

const INPUT = "min-h-11 w-full rounded-md border border-muted-foreground bg-card text-card-foreground";

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "className"> {
  /** Used as both the element id and the field name. */
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  /** Rendered inside the input's right edge (for example the show/hide button). */
  trailing?: ReactNode;
}

/** Label, input and field message shared by the sign-in and sign-up forms. */
export function AuthField({ id, label, error, hint, trailing, ...input }: AuthFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          {...input}
          id={id}
          name={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`${INPUT} ${trailing ? "pl-3 pr-12" : "px-3"}`}
        />
        {trailing}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Show/hide button for a password field. Pass the ids of every field it controls. */
export function PasswordToggle({ visible, controls, onToggle }: { visible: boolean; controls: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-controls={controls}
      aria-label={visible ? strings.auth.hidePassword : strings.auth.showPassword}
      className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground"
    >
      {visible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
    </button>
  );
}

export function AuthMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
      {children}
    </p>
  );
}

/** "Already have an account? Sign in" style line. Keeps the redirect target when there is one. */
export function AuthSwitch({ prompt, label, path, next }: { prompt: string; label: string; path: string; next: string }) {
  const href = next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`;
  return (
    <p className="mt-6 text-muted-foreground">
      {prompt}{" "}
      <Link
        href={href}
        className="inline-flex min-h-11 items-center font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
      >
        {label}
      </Link>
    </p>
  );
}
