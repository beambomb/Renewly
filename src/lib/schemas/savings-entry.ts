import { z } from "zod";
import { isValidDate, type CalendarDate } from "@/lib/dates/calendar";
import { parseAmount } from "@/lib/money/amount";
import { adjustmentFor, canWithdraw } from "@/lib/savings/savings";
import type { FieldError } from "@/lib/schemas/profile";
import { MAX_SAVINGS_MAJOR } from "@/lib/schemas/item";
import { strings } from "@/lib/strings";

const e = strings.savingsEntry.errors;

export const ENTRY_ACTIONS = ["deposit", "withdraw", "correct"] as const;
export type EntryAction = (typeof ENTRY_ACTIONS)[number];

export interface SavingsEntryContext {
  currency: string;
  savedMinor: number;
  today: CalendarDate;
}

export interface SavingsEntryInput {
  entryType: "deposit" | "withdrawal" | "adjustment";
  /** Signed: deposits positive, withdrawals negative, adjustments either. */
  amountMinor: number;
  occurredOn: CalendarDate;
  note: string | null;
}

export type ParsedSavingsEntry =
  | { success: true; data: SavingsEntryInput }
  | { success: false; errors: FieldError[] };

const noteSchema = z
  .string()
  .trim()
  .max(200, e.noteTooLong)
  .transform((value) => (value === "" ? null : value));

const dateSchema = z.string().trim().refine(isValidDate, e.dateInvalid);

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Validates the add-money form: a deposit, a withdrawal, or a corrected total. */
export function parseSavingsEntryForm(formData: FormData, context: SavingsEntryContext): ParsedSavingsEntry {
  const errors: FieldError[] = [];
  const fail = (fieldName: string, message: string) => errors.push({ field: fieldName, message });

  const action = ENTRY_ACTIONS.find((a) => a === field(formData, "action"));
  if (!action) fail("action", e.actionInvalid);

  const note = noteSchema.safeParse(field(formData, "note"));
  if (!note.success) fail("note", e.noteTooLong);

  const rawDate = field(formData, "occurredOn").trim();
  const dateText = rawDate === "" ? context.today : rawDate;
  const date = dateSchema.safeParse(dateText);
  if (!date.success) fail("occurredOn", e.dateInvalid);
  else if (date.data > context.today) fail("occurredOn", e.dateInFuture);

  let entryType: SavingsEntryInput["entryType"] | undefined;
  let amountMinor: number | undefined;

  if (action === "correct") {
    const parsed = parseAmount(field(formData, "newTotal"), context.currency, MAX_SAVINGS_MAJOR);
    if (!("minor" in parsed)) fail("newTotal", e.amountInvalid);
    else if (parsed.minor === context.savedMinor) fail("newTotal", e.sameTotal);
    else {
      entryType = "adjustment";
      amountMinor = adjustmentFor(context.savedMinor, parsed.minor);
    }
  } else if (action === "deposit" || action === "withdraw") {
    const parsed = parseAmount(field(formData, "amount"), context.currency, MAX_SAVINGS_MAJOR);
    if (!("minor" in parsed) || parsed.minor <= 0) fail("amount", e.amountInvalid);
    else if (action === "withdraw" && !canWithdraw(context.savedMinor, parsed.minor)) fail("amount", e.notEnough);
    else {
      entryType = action === "deposit" ? "deposit" : "withdrawal";
      amountMinor = action === "deposit" ? parsed.minor : -parsed.minor;
    }
  }

  if (errors.length > 0 || !entryType || amountMinor === undefined || !date.success || !note.success) {
    return { success: false, errors };
  }
  return { success: true, data: { entryType, amountMinor, occurredOn: date.data, note: note.data } };
}
