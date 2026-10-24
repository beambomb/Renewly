"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
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

interface Props {
  kind: ItemKind;
  mode: "create" | "edit";
  action: (previous: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  initial: FormValues;
  currencies: Option[];
  cancelHref: string;
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
  const checked = (key: string): boolean => text(key) === "on";
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
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <FormErrorSummary errors={errors} />
      {formError ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {formError}
        </p>
      ) : null}

      <section aria-labelledby="basics-heading" className="flex flex-col gap-4">
        <h2 id="basics-heading" className="text-xl font-semibold text-foreground">
          {strings.item.sections.basics}
        </h2>
        <TextField
          id="name"
          label={nameLabel(kind)}
          defaultValue={text("name")}
          error={error("name")}
          maxLength={80}
          autoComplete="off"
        />
        {kind === "subscription" && <SubscriptionFields {...common} currencies={currencies} />}
        {kind === "recurring" && <RecurringFields {...common} currencies={currencies} />}
        {kind === "warranty" && <WarrantyFields {...common} />}
        {kind === "reminder" && <ReminderFields {...common} />}
        {kind === "savings" && <SavingsFields {...common} currencies={currencies} editing={mode === "edit"} />}
      </section>

      <section aria-labelledby="more-heading" className="flex flex-col gap-4">
        <h2 id="more-heading" className="text-xl font-semibold text-foreground">
          {strings.item.sections.extras}
        </h2>
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
        />
      </section>

      <ReminderDays
        useDefault={checked("useDefaultOffsets")}
        selected={Array.isArray(values.offsets) ? values.offsets : []}
        error={error("offsets")}
      />

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
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
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <TextField id="price" label={f.price} defaultValue={text("price")} error={error("price")} inputMode="decimal" />
        <SelectField id="currency" label={f.currency} defaultValue={text("currency")} error={error("currency")} options={currencies} />
      </div>
      <BillingCycleSelect
        id="billingCycle"
        label={f.billingCycle}
        value={cycle}
        onChange={setCycle}
        error={error("billingCycle")}
        allowNone={false}
      />
      {cycle === "custom" && (
        <TextField id="cycleDays" label={f.cycleDays} defaultValue={text("cycleDays")} error={error("cycleDays")} inputMode="numeric" />
      )}
      <TextField
        id="nextBillingDate"
        label={f.nextBillingDate}
        type="date"
        defaultValue={text("nextBillingDate")}
        error={error("nextBillingDate")}
      />
      <CheckboxField id="autoRenew" label={f.autoRenew} defaultChecked={text("autoRenew") === "on"} />
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
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <TextField id="usualPrice" label={f.usualPrice} defaultValue={text("usualPrice")} error={error("usualPrice")} inputMode="decimal" required={false} />
        <SelectField id="usualCurrency" label={f.currency} defaultValue={text("usualCurrency")} error={error("usualCurrency")} options={currencies} />
      </div>
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
      {repeat === "custom" && (
        <TextField id="cycleDays" label={f.cycleDays} defaultValue={text("cycleDays")} error={error("cycleDays")} inputMode="numeric" />
      )}
    </>
  );
}

function SavingsFields({ text, error, currencies, editing }: FieldProps & { currencies: Option[]; editing: boolean }) {
  return (
    <>
      <SelectField
        id="currency"
        label={f.currencyGoal}
        defaultValue={text("currency")}
        error={error("currency")}
        options={currencies}
        disabled={editing}
        hint={editing ? strings.item.fields.currencyLocked : undefined}
      />
      <TextField id="targetAmount" label={f.targetAmount} defaultValue={text("targetAmount")} error={error("targetAmount")} inputMode="decimal" />
      {!editing && (
        <TextField
          id="startingAmount"
          label={f.startingAmount}
          hint={f.startingAmountHint}
          defaultValue={text("startingAmount")}
          error={error("startingAmount")}
          inputMode="decimal"
          required={false}
        />
      )}
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
    <div className="flex flex-col gap-2">
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
  const choices = [...new Set<number>([...OFFSET_CHOICES, ...selected.map(Number).filter(Number.isInteger)])].sort((a, b) => b - a);
  return (
    <section aria-labelledby="reminders-heading" className="flex flex-col gap-3">
      <h2 id="reminders-heading" className="text-xl font-semibold text-foreground">
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
      {!useDefault && (
        <fieldset id="offsets" tabIndex={-1} aria-describedby={error ? "offsets-error" : undefined} className="flex flex-col gap-1">
          <legend className="mb-1 font-medium text-foreground">{strings.settings.remindersLegend}</legend>
          {choices.map((days) => (
            <label key={days} className="flex min-h-11 items-center gap-3 text-foreground">
              <input
                type="checkbox"
                name="offsets"
                value={days}
                defaultChecked={selected.map(Number).includes(days)}
                className="size-5 accent-primary"
              />
              {strings.settings.offsetLabel(days)}
            </label>
          ))}
          {error ? (
            <p id="offsets-error" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </fieldset>
      )}
    </section>
  );
}
