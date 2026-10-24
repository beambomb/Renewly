"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { FormErrorSummary } from "@/components/form/form-error-summary";
import {
  CheckboxField,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  SelectField,
  TextAreaField,
  TextField,
  type Option,
} from "@/components/form/fields";
import { BILLING_CYCLES, type ItemKind } from "@/lib/items/types";
import type { FormValues } from "@/lib/schemas/item";
import { OFFSET_CHOICES, type FieldError } from "@/lib/schemas/profile";
import { strings } from "@/lib/strings";
import type { ItemFormState } from "../actions";

const f = strings.item.fields;
const INITIAL: ItemFormState = { status: "idle" };
// Container-query variants (@xl) follow the form's own width, not the viewport,
// because the sidebar takes 256px from 768px and would leave two cramped columns.
const SPAN = "@xl:col-span-2";

interface Props {
  kind: ItemKind;
  mode: "create" | "edit";
  action: (previous: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  initial: FormValues;
  currencies: Option[];
  cancelHref: string;
}

/** A titled group of fields: one column when the form is narrow, two from 36rem of form width. */
function FormSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-card p-5 text-card-foreground md:p-6">
      <h2 id={id} className="mb-4 text-lg font-semibold text-foreground">
        {title}
      </h2>
      <div className="grid gap-4 @xl:grid-cols-2 @xl:gap-x-6">{children}</div>
    </section>
  );
}

export function ItemForm({ kind, mode, action, initial, currencies, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const errors: FieldError[] = useMemo(() => (state.status === "error" ? state.errors : []), [state]);
  // After a failed save the server returns what was typed; otherwise show the starting values.
  const values: FormValues = state.status === "error" ? state.values : initial;

  const text = (key: string): string => {
    const value = values[key];
    return typeof value === "string" ? value : "";
  };
  const error = (key: string): string | undefined => errors.find((e) => e.field === key)?.message;
  const formError = error("form");

  // A single error has no summary, so move focus to its field.
  useEffect(() => {
    if (errors.length === 1 && errors[0] && errors[0].field !== "form") {
      document.getElementById(errors[0].field)?.focus();
    }
  }, [errors]);

  const common = { text, error };

  return (
    <form action={formAction} noValidate className="@container flex flex-col gap-5">
      <FormErrorSummary errors={errors} />
      {formError ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {formError}
        </p>
      ) : null}

      <FormSection id="basics-heading" title={strings.item.sections.basics}>
        <TextField
          id="name"
          label={nameLabel(kind)}
          defaultValue={text("name")}
          error={error("name")}
          maxLength={80}
          className={SPAN}
        />
        {kind === "subscription" && <SubscriptionFields {...common} currencies={currencies} />}
        {kind === "recurring" && <RecurringFields {...common} currencies={currencies} />}
        {kind === "warranty" && <WarrantyFields {...common} />}
        {kind === "reminder" && <ReminderFields {...common} />}
        {kind === "savings" && <SavingsFields {...common} currencies={currencies} editing={mode === "edit"} />}
      </FormSection>

      <FormSection id="more-heading" title={strings.item.sections.extras}>
        <TextField
          id="emoji"
          label={f.emoji}
          hint={f.emojiHint}
          defaultValue={text("emoji")}
          error={error("emoji")}
          required={false}
          maxLength={8}
        />
        <TextField
          id="category"
          label={f.category}
          hint={f.categoryHint}
          defaultValue={text("category")}
          error={error("category")}
          required={false}
          maxLength={40}
        />
        <TextAreaField
          id="notes"
          label={f.notes}
          defaultValue={text("notes")}
          error={error("notes")}
          required={false}
          maxLength={2000}
          className={SPAN}
        />
      </FormSection>

      <ReminderDays
        useDefault={text("useDefaultOffsets") === "on"}
        selected={Array.isArray(values.offsets) ? values.offsets : []}
        error={error("offsets")}
      />

      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
        <button type="submit" disabled={pending} className={`${PRIMARY_BUTTON} sm:min-w-40`}>
          {pending ? strings.item.actions.saving : mode === "create" ? strings.item.actions.add : strings.item.actions.save}
        </button>
        <Link href={cancelHref} className={SECONDARY_BUTTON}>
          {strings.item.actions.cancel}
        </Link>
      </div>
    </form>
  );
}

function nameLabel(kind: ItemKind): string {
  switch (kind) {
    case "subscription":
      return f.nameSubscription;
    case "recurring":
      return f.nameRecurring;
    case "warranty":
      return f.nameWarranty;
    case "reminder":
      return f.reminderTitle;
    case "savings":
      return f.goalName;
  }
}

interface FieldProps {
  text: (key: string) => string;
  error: (key: string) => string | undefined;
}

const CYCLE_LABELS = strings.item.cycles;

function SubscriptionFields({ text, error, currencies }: FieldProps & { currencies: Option[] }) {
  const [cycle, setCycle] = useState(text("billingCycle") || "monthly");
  return (
    <>
      <TextField id="price" label={f.price} defaultValue={text("price")} error={error("price")} inputMode="decimal" />
      <SelectField id="currency" label={f.currency} defaultValue={text("currency")} error={error("currency")} options={currencies} />
      <BillingCycleSelect
        id="billingCycle"
        label={f.billingCycle}
        value={cycle}
        onChange={setCycle}
        error={error("billingCycle")}
        allowNone={false}
      />
      {cycle === "custom" ? (
        <TextField id="cycleDays" label={f.cycleDays} defaultValue={text("cycleDays")} error={error("cycleDays")} inputMode="numeric" />
      ) : null}
      <TextField
        id="nextBillingDate"
        label={f.nextBillingDate}
        type="date"
        defaultValue={text("nextBillingDate")}
        error={error("nextBillingDate")}
      />
      <TextField
        id="paymentMethod"
        label={f.paymentMethod}
        hint={f.paymentMethodHint}
        defaultValue={text("paymentMethod")}
        error={error("paymentMethod")}
        required={false}
        maxLength={80}
      />
      <TextField
        id="cancelUrl"
        label={f.cancelUrl}
        hint={f.cancelUrlHint}
        type="url"
        inputMode="url"
        defaultValue={text("cancelUrl")}
        error={error("cancelUrl")}
        required={false}
      />
      <CheckboxField id="autoRenew" label={f.autoRenew} defaultChecked={text("autoRenew") === "on"} className={SPAN} />
    </>
  );
}

function RecurringFields({ text, error, currencies }: FieldProps & { currencies: Option[] }) {
  return (
    <>
      <TextField id="lastPurchasedOn" label={f.lastPurchasedOn} type="date" defaultValue={text("lastPurchasedOn")} error={error("lastPurchasedOn")} />
      <TextField
        id="durationDays"
        label={f.durationDays}
        hint={f.durationHint}
        defaultValue={text("durationDays")}
        error={error("durationDays")}
        inputMode="numeric"
      />
      <TextField id="usualPrice" label={f.usualPrice} defaultValue={text("usualPrice")} error={error("usualPrice")} inputMode="decimal" required={false} />
      <SelectField id="usualCurrency" label={f.currency} defaultValue={text("usualCurrency")} error={error("usualCurrency")} options={currencies} />
      <TextField id="usualStore" label={f.usualStore} defaultValue={text("usualStore")} error={error("usualStore")} required={false} maxLength={80} />
      <TextField id="usualQuantity" label={f.usualQuantity} defaultValue={text("usualQuantity")} error={error("usualQuantity")} inputMode="decimal" required={false} />
    </>
  );
}

function WarrantyFields({ text, error }: FieldProps) {
  return (
    <>
      <TextField id="purchasedOn" label={f.purchasedOn} type="date" defaultValue={text("purchasedOn")} error={error("purchasedOn")} />
      <TextField id="warrantyMonths" label={f.warrantyMonths} defaultValue={text("warrantyMonths")} error={error("warrantyMonths")} inputMode="numeric" />
      <TextField id="serialNumber" label={f.serialNumber} defaultValue={text("serialNumber")} error={error("serialNumber")} required={false} maxLength={80} />
    </>
  );
}

function ReminderFields({ text, error }: FieldProps) {
  const [repeat, setRepeat] = useState(text("repeat"));
  return (
    <>
      <TextField id="date" label={f.reminderDate} type="date" defaultValue={text("date")} error={error("date")} />
      <BillingCycleSelect id="repeat" label={f.repeat} value={repeat} onChange={setRepeat} error={error("repeat")} allowNone />
      {repeat === "custom" ? (
        <TextField id="cycleDays" label={f.cycleDays} defaultValue={text("cycleDays")} error={error("cycleDays")} inputMode="numeric" />
      ) : null}
    </>
  );
}

function SavingsFields({ text, error, currencies, editing }: FieldProps & { currencies: Option[]; editing: boolean }) {
  return (
    <>
      <TextField id="targetAmount" label={f.targetAmount} defaultValue={text("targetAmount")} error={error("targetAmount")} inputMode="decimal" />
      <SelectField
        id="currency"
        label={f.currencyGoal}
        defaultValue={text("currency")}
        error={error("currency")}
        options={currencies}
        disabled={editing}
        hint={editing ? f.currencyLocked : undefined}
      />
      {!editing ? (
        <TextField
          id="startingAmount"
          label={f.startingAmount}
          hint={f.startingAmountHint}
          defaultValue={text("startingAmount")}
          error={error("startingAmount")}
          inputMode="decimal"
          required={false}
        />
      ) : null}
      <TextField
        id="deadline"
        label={f.deadline}
        hint={f.deadlineHint}
        type="date"
        defaultValue={text("deadline")}
        error={error("deadline")}
        required={false}
      />
    </>
  );
}

/** A controlled select, because other fields appear depending on the choice. */
function BillingCycleSelect({
  id,
  label,
  value,
  onChange,
  error,
  allowNone,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  allowNone: boolean;
}) {
  const options = [
    ...(allowNone ? [{ value: "", label: f.repeatNone }] : []),
    ...BILLING_CYCLES.map((cycle) => ({ value: cycle, label: CYCLE_LABELS[cycle] })),
  ];
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-11 w-full rounded-md border border-muted-foreground bg-card px-3 text-card-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ReminderDays({
  useDefault: initialUseDefault,
  selected,
  error,
}: {
  useDefault: boolean;
  selected: string[];
  error?: string | undefined;
}) {
  const [useDefault, setUseDefault] = useState(initialUseDefault);
  const chosen = selected.map(Number);
  const choices = [...new Set<number>([...OFFSET_CHOICES, ...chosen.filter(Number.isInteger)])].sort((a, b) => b - a);
  return (
    <section aria-labelledby="reminders-heading" className="rounded-lg border border-border bg-card p-5 text-card-foreground md:p-6">
      <h2 id="reminders-heading" className="mb-2 text-lg font-semibold text-foreground">
        {strings.item.sections.reminders}
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="useDefaultOffsets" className="flex min-h-11 items-center gap-3 font-medium text-foreground">
          <input
            id="useDefaultOffsets"
            name="useDefaultOffsets"
            type="checkbox"
            checked={useDefault}
            onChange={(event) => setUseDefault(event.target.checked)}
            aria-describedby="useDefaultOffsets-hint"
            className="size-5 accent-primary"
          />
          {f.useDefaultReminders}
        </label>
        <p id="useDefaultOffsets-hint" className="text-sm text-muted-foreground">
          {f.useDefaultRemindersHint}
        </p>
      </div>
      {!useDefault ? (
        <fieldset
          id="offsets"
          tabIndex={-1}
          aria-describedby={error ? "offsets-error" : undefined}
          className="mt-4 grid gap-x-6 @xl:grid-cols-2"
        >
          <legend className="mb-1 font-medium text-foreground">{strings.settings.remindersLegend}</legend>
          {choices.map((days) => (
            <label key={days} className="flex min-h-11 items-center gap-3 text-foreground">
              <input
                type="checkbox"
                name="offsets"
                value={days}
                defaultChecked={chosen.includes(days)}
                className="size-5 accent-primary"
              />
              {strings.settings.offsetLabel(days)}
            </label>
          ))}
          {error ? (
            <p id="offsets-error" className="text-sm font-medium text-destructive @xl:col-span-2">
              {error}
            </p>
          ) : null}
        </fieldset>
      ) : null}
    </section>
  );
}
