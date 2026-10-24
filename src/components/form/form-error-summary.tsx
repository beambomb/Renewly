"use client";

import { useEffect, useRef } from "react";
import type { FieldError } from "@/lib/schemas/profile";
import { strings } from "@/lib/strings";

/**
 * Linked summary shown when a form has more than one error. It takes focus
 * when it appears so keyboard and screen reader users land on it, and each
 * entry jumps to its field. Single errors are shown inline only.
 */
export function FormErrorSummary({ errors }: { errors: readonly FieldError[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 1) ref.current?.focus();
  }, [errors]);

  if (errors.length < 2) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-md border border-destructive p-4 text-foreground"
    >
      <h2 className="font-semibold text-destructive">{strings.form.errorSummaryTitle}</h2>
      <ul className="mt-2 list-disc pl-5">
        {errors.map((error) => (
          <li key={error.field}>
            <a href={`#${error.field}`} className="underline">
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
