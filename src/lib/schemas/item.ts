import { z } from "zod";
import { isValidDate, type CalendarDate } from "@/lib/dates/calendar";
import {
  BILLING_CYCLES,
  type BillingCycle,
  type ItemInput,
  type ItemKind,
} from "@/lib/items/types";
import { parseAmount, type AmountResult } from "@/lib/money/amount";
import { minorUnitDigits } from "@/lib/money/money";
import { currencySchema, reminderOffsetsSchema, type FieldError } from "@/lib/schemas/profile";
import { strings } from "@/lib/strings";

const e = strings.item.errors;

/** Largest accepted amounts, in whole currency units. */
export const MAX_PRICE_MAJOR = 1_000_000_000;
export const MAX_SAVINGS_MAJOR = 1_000_000_000_000;

export interface ParseContext {
  /** The user's current local date, used to reject future purchase dates. */
  today: CalendarDate;
}

/** Submitted values keyed by field name, used to refill the form after an error. */
export type FormValues = Record<string, string | string[]>;

export type ParsedItem =
  | { success: true; data: ItemInput }
  | { success: false; errors: FieldError[]; values: FormValues };

/* ---------- single-field zod schemas ---------- */

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));

const requiredName = z.string().trim().min(1, e.nameRequired).max(80, e.nameRequired);

const emojiField = optionalText(8, e.emojiInvalid).refine(
  (value) => value === null || /\p{Extended_Pictographic}/u.test(value),
  e.emojiInvalid,
);

const dateField = z.string().trim().refine(isValidDate, e.dateInvalid);

const optionalDateField = z
  .string()
  .trim()
  .refine((value) => value === "" || isValidDate(value), e.dateInvalid)
  .transform((value) => (value === "" ? null : value));

const wholeNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,5}$/, message)
    .transform(Number)
    .refine((n) => n >= min && n <= max, message);

const httpsUrlField = optionalText(500, e.urlInvalid).refine(
  (value) => value === null || (/^https:\/\/[^\s]+$/i.test(value) && z.url().safeParse(value).success),
  e.urlInvalid,
);

const quantityField = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .refine((value) => value === "" || (/^\d{1,8}(\.\d{1,2})?$/.test(value) && Number(value) > 0), e.quantityInvalid)
  .transform((value) => (value === "" ? null : Number(value)));

const repeatField = z
  .string()
  .trim()
  .refine((value) => value === "" || (BILLING_CYCLES as readonly string[]).includes(value), e.repeatInvalid)
  .transform((value) => (value === "" ? null : (value as BillingCycle)));

/* ---------- collecting every error in one pass ---------- */

class Collector {
  readonly issues: FieldError[] = [];

  /** Validates one value; records the first problem and returns undefined on failure. */
  get<T>(schema: z.ZodType<T>, value: unknown, field: string): T | undefined {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    this.issues.push({ field, message: result.error.issues[0]?.message ?? e.saveFailed });
    return undefined;
  }

  fail(field: string, message: string): void {
    this.issues.push({ field, message });
  }

  /** An amount in a currency's minor units, or undefined after recording an error. */
  amount(raw: string, currency: string, field: string, maxMajor: number): number | undefined {
    const result: AmountResult = parseAmount(raw, currency, maxMajor);
    if ("minor" in result) return result.minor;
    this.fail(
      field,
      result.error === "decimals"
        ? e.priceDecimals(minorUnitDigits(currency))
        : result.error === "range"
          ? e.amountRange
          : e.amountInvalid,
    );
    return undefined;
  }

  get ok(): boolean {
    return this.issues.length === 0;
  }
}

/* ---------- FormData helpers ---------- */

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function collectValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    values[key] = all.length > 1 || key === "offsets" ? all : (all[0] ?? "");
  }
  return values;
}

function parseCommon(formData: FormData, c: Collector) {
  const name = c.get(requiredName, text(formData, "name"), "name");
  const category = c.get(optionalText(40, e.categoryTooLong), text(formData, "category"), "category");
  const notes = c.get(optionalText(2000, e.notesTooLong), text(formData, "notes"), "notes");
  const emoji = c.get(emojiField, text(formData, "emoji"), "emoji");
  let reminderOffsets: number[] | null = null;
  if (formData.get("useDefaultOffsets") !== "on") {
    reminderOffsets = c.get(reminderOffsetsSchema, formData.getAll("offsets").map(String), "offsets") ?? null;
  }
  return { name: name ?? "", category: category ?? null, notes: notes ?? null, emoji: emoji ?? null, reminderOffsets };
}

/* ---------- per-section parsing ---------- */

function parseSubscription(formData: FormData, c: Collector): ItemInput | undefined {
  const common = parseCommon(formData, c);
  const currency = c.get(currencySchema, text(formData, "currency"), "currency");
  const priceMinor = currency ? c.amount(text(formData, "price"), currency, "price", MAX_PRICE_MAJOR) : undefined;
  if (!currency && !text(formData, "price").trim()) c.fail("price", e.amountInvalid);

  const rawCycle = text(formData, "billingCycle");
  const billingCycle = BILLING_CYCLES.find((cycle) => cycle === rawCycle);
  if (!billingCycle) c.fail("billingCycle", e.cycleInvalid);

  const cycleDays =
    billingCycle === "custom"
      ? (c.get(wholeNumber(1, 3650, e.cycleDaysInvalid), text(formData, "cycleDays"), "cycleDays") ?? null)
      : null;

  const nextBillingDate = c.get(dateField, text(formData, "nextBillingDate"), "nextBillingDate");
  const paymentMethod = c.get(optionalText(80, e.textTooLong(80)), text(formData, "paymentMethod"), "paymentMethod");
  const cancelUrl = c.get(httpsUrlField, text(formData, "cancelUrl"), "cancelUrl");

  if (!c.ok || !currency || priceMinor === undefined || !billingCycle || !nextBillingDate) return undefined;
  return {
    kind: "subscription",
    ...common,
    priceMinor,
    currency,
    billingCycle,
    cycleDays,
    nextBillingDate,
    paymentMethod: paymentMethod ?? null,
    autoRenew: formData.get("autoRenew") === "on",
    cancelUrl: cancelUrl ?? null,
  };
}

function parseRecurring(formData: FormData, c: Collector, today: CalendarDate): ItemInput | undefined {
  const common = parseCommon(formData, c);
  const lastPurchasedOn = c.get(dateField, text(formData, "lastPurchasedOn"), "lastPurchasedOn");
  if (lastPurchasedOn && lastPurchasedOn > today) c.fail("lastPurchasedOn", e.dateInFuture);
  const durationDays = c.get(wholeNumber(1, 3650, e.durationInvalid), text(formData, "durationDays"), "durationDays");
  const usualStore = c.get(optionalText(80, e.textTooLong(80)), text(formData, "usualStore"), "usualStore");
  const usualQuantity = c.get(quantityField, text(formData, "usualQuantity"), "usualQuantity");

  let usualPriceMinor: number | null = null;
  let usualCurrency: string | null = null;
  if (text(formData, "usualPrice").trim() !== "") {
    const currency = c.get(currencySchema, text(formData, "usualCurrency"), "usualCurrency");
    if (currency) {
      usualCurrency = currency;
      usualPriceMinor = c.amount(text(formData, "usualPrice"), currency, "usualPrice", MAX_PRICE_MAJOR) ?? null;
    }
  }

  if (!c.ok || !lastPurchasedOn || durationDays === undefined) return undefined;
  return {
    kind: "recurring",
    ...common,
    lastPurchasedOn,
    durationDays,
    usualPriceMinor,
    usualCurrency,
    usualStore: usualStore ?? null,
    usualQuantity: usualQuantity ?? null,
  };
}

function parseWarranty(formData: FormData, c: Collector, today: CalendarDate): ItemInput | undefined {
  const common = parseCommon(formData, c);
  const purchasedOn = c.get(dateField, text(formData, "purchasedOn"), "purchasedOn");
  if (purchasedOn && purchasedOn > today) c.fail("purchasedOn", e.dateInFuture);
  const warrantyMonths = c.get(wholeNumber(1, 600, e.monthsInvalid), text(formData, "warrantyMonths"), "warrantyMonths");
  const serialNumber = c.get(optionalText(80, e.textTooLong(80)), text(formData, "serialNumber"), "serialNumber");

  if (!c.ok || !purchasedOn || warrantyMonths === undefined) return undefined;
  return { kind: "warranty", ...common, purchasedOn, warrantyMonths, serialNumber: serialNumber ?? null };
}

function parseReminder(formData: FormData, c: Collector): ItemInput | undefined {
  const common = parseCommon(formData, c);
  const date = c.get(dateField, text(formData, "date"), "date");
  const repeat = c.get(repeatField, text(formData, "repeat"), "repeat");
  const cycleDays =
    repeat === "custom"
      ? (c.get(wholeNumber(1, 3650, e.cycleDaysInvalid), text(formData, "cycleDays"), "cycleDays") ?? null)
      : null;

  if (!c.ok || !date) return undefined;
  return { kind: "reminder", ...common, date, repeat: repeat ?? null, cycleDays };
}

function parseSavings(formData: FormData, c: Collector): ItemInput | undefined {
  const common = parseCommon(formData, c);
  const currency = c.get(currencySchema, text(formData, "currency"), "currency");
  let targetMinor: number | undefined;
  let startingMinor = 0;
  if (currency) {
    targetMinor = c.amount(text(formData, "targetAmount"), currency, "targetAmount", MAX_SAVINGS_MAJOR);
    if (targetMinor !== undefined && targetMinor <= 0) {
      c.fail("targetAmount", e.targetRequired);
      targetMinor = undefined;
    }
    if (text(formData, "startingAmount").trim() !== "") {
      startingMinor = c.amount(text(formData, "startingAmount"), currency, "startingAmount", MAX_SAVINGS_MAJOR) ?? 0;
    }
  } else if (!text(formData, "targetAmount").trim()) {
    c.fail("targetAmount", e.targetRequired);
  }
  const deadline = c.get(optionalDateField, text(formData, "deadline"), "deadline");

  if (!c.ok || !currency || targetMinor === undefined) return undefined;
  return { kind: "savings", ...common, currency, targetMinor, startingMinor, deadline: deadline ?? null };
}

/* ---------- entry point shared by client checks and server actions ---------- */

export function parseItemForm(kind: ItemKind, formData: FormData, context: ParseContext): ParsedItem {
  const collector = new Collector();
  let data: ItemInput | undefined;

  switch (kind) {
    case "subscription":
      data = parseSubscription(formData, collector);
      break;
    case "recurring":
      data = parseRecurring(formData, collector, context.today);
      break;
    case "warranty":
      data = parseWarranty(formData, collector, context.today);
      break;
    case "reminder":
      data = parseReminder(formData, collector);
      break;
    case "savings":
      data = parseSavings(formData, collector);
      break;
  }

  if (data && collector.ok) return { success: true, data };

  // One error per field, in the order they were found.
  const seen = new Set<string>();
  const errors = collector.issues.filter((issue) => {
    if (seen.has(issue.field)) return false;
    seen.add(issue.field);
    return true;
  });
  return { success: false, errors, values: collectValues(formData) };
}
