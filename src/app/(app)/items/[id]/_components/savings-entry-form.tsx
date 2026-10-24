"use client";

import { useActionState, useState } from "react";
import { FormErrorSummary } from "@/components/form/form-error-summary";
import { PRIMARY_BUTTON, TextField } from "@/components/form/fields";
import type { ENTRY_ACTIONS } from "@/lib/schemas/savings-entry";
import { strings } from "@/lib/strings";
import type { EntryFormState } from "../../actions";

const t = strings.savingsEntry;
const INITIAL: EntryFormState = { status: "idle" };

type Action = (typeof ENTRY_ACTIONS)[number];
const ACTIONS: readonly Action[] = ["deposit", "withdraw", "correct"];

interface Props {
  action: (previous: EntryFormState, formData: FormData) => Promise<EntryFormState>;
  today: string;
}

/** Add money, take money out, or set the total, for one savings goal. */
export function SavingsEntryForm({ action, today }: Props) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [mode, setMode] = useState<Action>("deposit");
  const errors = state.status === "error" ? state.errors : [];
  const error = (key: string) => errors.find((e) => e.field === key)?.message;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">{t.title}</h2>

      <FormErrorSummary errors={errors} />
      {error("form") ? (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {error("form")}
        </p>
      ) : null}
      {state.status === "saved" ? (
        <p role="status" className="rounded-md border border-border bg-card p-3 text-card-foreground">
          {t.saved}
        </p>
      ) : null}

      <fieldset className="grid grid-cols-3 gap-2" id="action">
        <legend className="sr-only">{t.title}</legend>
        {ACTIONS.map((value) => (
          <label
            key={value}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-sm font-medium ${
              mode === value ? "border-primary bg-primary text-on-primary" : "border-muted-foreground text-foreground"
            } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}
          >
            <input
              type="radio"
              name="action"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="sr-only"
            />
            {t.actions[value]}
          </label>
        ))}
      </fieldset>
      {error("action") ? <p className="text-sm font-medium text-destructive">{error("action")}</p> : null}

      {mode === "correct" ? (
        <TextField id="newTotal" label={t.fields.newTotal} inputMode="decimal" error={error("newTotal")} />
      ) : (
        <TextField id="amount" label={t.fields.amount} inputMode="decimal" error={error("amount")} />
      )}
      <TextField id="occurredOn" label={t.fields.date} type="date" defaultValue={today} error={error("occurredOn")} />
      <TextField id="note" label={t.fields.note} hint={t.fields.noteHint} error={error("note")} maxLength={200} />

      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
