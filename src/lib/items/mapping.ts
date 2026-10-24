import { z } from "zod";
import { deriveColumns } from "./derive";
import { BILLING_CYCLES, ITEM_KINDS, type Item, type ItemInput } from "./types";
import type { CalendarDate } from "@/lib/dates/calendar";

/** Columns written for an item. `user_id` is never sent: the database defaults it to auth.uid(). */
export type ItemRow = Record<string, unknown>;

/**
 * Builds the row to insert or update for validated input. The kind never
 * changes after creation, and `saved_minor` is only ever set by the database.
 */
export function inputToRow(
  input: ItemInput,
  options: { today: CalendarDate; previousPeriodStart?: CalendarDate | null | undefined; includeKind?: boolean },
): ItemRow {
  const derived = deriveColumns(input, options);
  const row: ItemRow = {
    ...(options.includeKind === false ? {} : { kind: input.kind }),
    name: input.name,
    category: input.category,
    notes: input.notes,
    emoji: input.emoji,
    reminder_offsets: input.reminderOffsets,
    period_start: derived.period_start,
    due_date: derived.due_date,
    ...derived.extra,
  };

  switch (input.kind) {
    case "subscription":
      Object.assign(row, {
        price_cents: input.priceMinor,
        currency: input.currency,
        billing_cycle: input.billingCycle,
        cycle_days: input.cycleDays,
        payment_method: input.paymentMethod,
        auto_renew: input.autoRenew,
        cancel_url: input.cancelUrl,
      });
      break;
    case "recurring":
      Object.assign(row, {
        last_purchased_on: input.lastPurchasedOn,
        duration_days: input.durationDays,
        usual_price_cents: input.usualPriceMinor,
        usual_currency: input.usualCurrency,
        usual_store: input.usualStore,
        usual_quantity: input.usualQuantity,
      });
      break;
    case "warranty":
      Object.assign(row, {
        purchased_on: input.purchasedOn,
        warranty_months: input.warrantyMonths,
        serial_number: input.serialNumber,
      });
      break;
    case "reminder":
      Object.assign(row, { billing_cycle: input.repeat, cycle_days: input.cycleDays });
      break;
    case "savings":
      Object.assign(row, { currency: input.currency, target_minor: input.targetMinor });
      break;
  }
  return row;
}

/* ---------- reading rows back ---------- */

const nullableNumber = z.union([z.number(), z.string()]).nullable().transform((value) => (value === null ? null : Number(value)));

export const itemRowSchema = z.object({
  id: z.string(),
  kind: z.enum(ITEM_KINDS as [string, ...string[]]),
  name: z.string(),
  category: z.string().nullable(),
  notes: z.string().nullable(),
  emoji: z.string().nullable(),
  logo_path: z.string().nullable(),
  status: z.enum(["active", "paused", "cancelled", "done"]),
  reminder_offsets: z.array(z.number().int()).nullable(),
  period_start: z.string().nullable(),
  due_date: z.string().nullable(),
  created_at: z.string(),

  price_cents: nullableNumber,
  currency: z.string().nullable(),
  billing_cycle: z.enum(BILLING_CYCLES as [string, ...string[]]).nullable(),
  cycle_days: z.number().int().nullable(),
  billing_anchor_day: z.number().int().nullable(),
  payment_method: z.string().nullable(),
  auto_renew: z.boolean().nullable(),
  cancel_url: z.string().nullable(),

  last_purchased_on: z.string().nullable(),
  duration_days: z.number().int().nullable(),
  usual_price_cents: nullableNumber,
  usual_currency: z.string().nullable(),
  usual_store: z.string().nullable(),
  usual_quantity: nullableNumber,

  purchased_on: z.string().nullable(),
  warranty_months: z.number().int().nullable(),
  expires_on: z.string().nullable(),
  serial_number: z.string().nullable(),
  receipt_path: z.string().nullable(),

  target_minor: nullableNumber,
  saved_minor: nullableNumber,
});

/** Column list for `select(...)`, kept next to the schema so they cannot drift apart. */
export const ITEM_COLUMNS = Object.keys(itemRowSchema.shape).join(", ");

export function rowToItem(row: unknown): Item {
  const r = itemRowSchema.parse(row);
  return {
    id: r.id,
    kind: r.kind as Item["kind"],
    name: r.name,
    category: r.category,
    notes: r.notes,
    emoji: r.emoji,
    logoPath: r.logo_path,
    status: r.status,
    reminderOffsets: r.reminder_offsets,
    periodStart: r.period_start,
    dueDate: r.due_date,
    createdAt: r.created_at,
    priceMinor: r.price_cents,
    currency: r.currency,
    billingCycle: r.billing_cycle as Item["billingCycle"],
    cycleDays: r.cycle_days,
    billingAnchorDay: r.billing_anchor_day,
    paymentMethod: r.payment_method,
    autoRenew: r.auto_renew,
    cancelUrl: r.cancel_url,
    lastPurchasedOn: r.last_purchased_on,
    durationDays: r.duration_days,
    usualPriceMinor: r.usual_price_cents,
    usualCurrency: r.usual_currency,
    usualStore: r.usual_store,
    usualQuantity: r.usual_quantity,
    purchasedOn: r.purchased_on,
    warrantyMonths: r.warranty_months,
    expiresOn: r.expires_on,
    serialNumber: r.serial_number,
    receiptPath: r.receipt_path,
    targetMinor: r.target_minor,
    savedMinor: r.saved_minor,
  };
}
