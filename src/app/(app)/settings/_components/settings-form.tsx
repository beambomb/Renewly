"use client";

import { useActionState } from "react";
import { FormErrorSummary } from "@/components/form/form-error-summary";
import type { SelectOption } from "@/lib/options";
import { OFFSET_CHOICES, type FieldError, type Profile } from "@/lib/schemas/profile";
import { strings } from "@/lib/strings";
import { updateSettings, type SettingsState } from "../actions";

const INITIAL: SettingsState = { status: "idle" };

const SELECT_CLASS =
  "min-h-11 rounded-md border border-muted-foreground bg-card px-3 text-card-foreground";

function errorFor(errors: readonly FieldError[], field: string): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}

interface Props {
  profile: Profile;
  timeZones: SelectOption[];
  currencies: SelectOption[];
}

export function SettingsForm({ profile, timeZones, currencies }: Props) {
  const [state, formAction, pending] = useActionState(updateSettings, INITIAL);
  const errors = state.status === "error" ? state.errors : [];
  const timezoneError = errorFor(errors, "timezone");
  const currencyError = errorFor(errors, "defaultCurrency");
  const offsetsError = errorFor(errors, "offsets");
  const formError = errorFor(errors, "form");

  // Keep any non-standard offsets the profile already has selectable.
  const offsetChoices = [...new Set<number>([...OFFSET_CHOICES, ...profile.reminderOffsets])].sort((a, b) => b - a);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <FormErrorSummary errors={errors} />

      {formError ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {formError}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p role="status" className="rounded-md border border-border bg-card p-3 text-card-foreground">
          {strings.form.saved}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="timezone" className="font-medium text-foreground">
          {strings.settings.timezoneLabel}
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={profile.timezone}
          aria-invalid={timezoneError ? true : undefined}
          aria-describedby={timezoneError ? "timezone-error" : undefined}
          className={SELECT_CLASS}
        >
          {timeZones.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {timezoneError ? (
          <p id="timezone-error" className="text-sm font-medium text-destructive">
            {timezoneError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="defaultCurrency" className="font-medium text-foreground">
          {strings.settings.currencyLabel}
        </label>
        <select
          id="defaultCurrency"
          name="defaultCurrency"
          defaultValue={profile.defaultCurrency}
          aria-invalid={currencyError ? true : undefined}
          aria-describedby={currencyError ? "currency-error" : undefined}
          className={SELECT_CLASS}
        >
          {currencies.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {currencyError ? (
          <p id="currency-error" className="text-sm font-medium text-destructive">
            {currencyError}
          </p>
        ) : null}
      </div>

      <fieldset
        id="offsets"
        tabIndex={-1}
        aria-describedby={offsetsError ? "offsets-error" : undefined}
        className="flex flex-col gap-1"
      >
        <legend className="mb-1 font-medium text-foreground">{strings.settings.remindersLegend}</legend>
        {offsetChoices.map((days) => (
          <label key={days} className="flex min-h-11 items-center gap-3 text-foreground">
            <input
              type="checkbox"
              name="offsets"
              value={days}
              defaultChecked={profile.reminderOffsets.includes(days)}
              className="size-5 accent-primary"
            />
            {strings.settings.offsetLabel(days)}
          </label>
        ))}
        {offsetsError ? (
          <p id="offsets-error" className="text-sm font-medium text-destructive">
            {offsetsError}
          </p>
        ) : null}
      </fieldset>

      <label className="flex min-h-11 items-center gap-3 font-medium text-foreground">
        <input
          type="checkbox"
          name="emailEnabled"
          defaultChecked={profile.emailEnabled}
          className="size-5 accent-primary"
        />
        {strings.settings.emailLabel}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md bg-primary px-6 font-medium text-on-primary transition-opacity duration-[var(--duration-press)] hover:opacity-90 active:opacity-80 disabled:opacity-60"
      >
        {pending ? strings.form.saving : strings.form.save}
      </button>
    </form>
  );
}
