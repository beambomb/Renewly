import type { ReactNode } from "react";

const CONTROL =
  "min-h-11 w-full rounded-md border border-muted-foreground bg-card px-3 text-card-foreground";

interface FieldBase {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  /** Shown as "(optional)" when false. Defaults to required. */
  required?: boolean | undefined;
  /** Extra classes for the wrapper, for example a grid column span. */
  className?: string | undefined;
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/** Label, control, hint and inline error wired together for assistive tech. */
export function Field({
  id,
  label,
  hint,
  error,
  required = true,
  className = "",
  children,
}: FieldBase & { children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="font-medium text-foreground">
        {label}
        {required ? null : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends FieldBase {
  name?: string;
  defaultValue?: string;
  type?: "text" | "date" | "url" | "number";
  inputMode?: "text" | "numeric" | "decimal" | "url";
  autoComplete?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function TextField({
  id,
  name = id,
  label,
  hint,
  error,
  required,
  className,
  defaultValue = "",
  type = "text",
  inputMode,
  autoComplete = "off",
  maxLength,
  placeholder,
  disabled,
  readOnly,
}: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={CONTROL}
      />
    </Field>
  );
}

export function TextAreaField({
  id,
  name = id,
  label,
  hint,
  error,
  required,
  className,
  defaultValue = "",
  maxLength,
  rows = 3,
}: FieldBase & { name?: string; defaultValue?: string; maxLength?: number; rows?: number }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${CONTROL} py-2`}
      />
    </Field>
  );
}

export interface Option {
  value: string;
  label: string;
}

export function SelectField({
  id,
  name = id,
  label,
  hint,
  error,
  required,
  className,
  defaultValue = "",
  options,
  disabled,
}: FieldBase & { name?: string; defaultValue?: string; options: readonly Option[]; disabled?: boolean }) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={CONTROL}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {disabled ? <input type="hidden" name={name} value={defaultValue} /> : null}
    </Field>
  );
}

export function CheckboxField({
  id,
  name = id,
  label,
  hint,
  defaultChecked = false,
  className = "",
}: {
  id: string;
  name?: string;
  label: string;
  hint?: string | undefined;
  defaultChecked?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="flex min-h-11 items-center gap-3 font-medium text-foreground">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="size-5 accent-primary"
        />
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const PRIMARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 font-medium text-on-primary transition-opacity duration-[var(--duration-press)] hover:opacity-90 active:opacity-80 disabled:opacity-60";
export const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-muted-foreground px-6 font-medium text-foreground transition-colors duration-[var(--duration-press)] hover:bg-muted active:bg-muted disabled:opacity-60";
export const DANGER_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-destructive px-6 font-medium text-on-destructive transition-opacity duration-[var(--duration-press)] hover:opacity-90 active:opacity-80 disabled:opacity-60";
