import { minorToMajor } from "@/lib/money/money";
import type { FormValues } from "@/lib/schemas/item";
import type { Item } from "./types";

/** A plain, re-parseable amount for an input: 15.49 for 1549 cents, 50000000 for rupiah. */
function amountText(minor: number | null, currency: string | null): string {
  if (minor === null || !currency) return "";
  return String(minorToMajor(minor, currency));
}

const text = (value: string | number | null): string => (value === null ? "" : String(value));

/** The form values that recreate an existing item in the edit form. */
export function itemToFormValues(item: Item): FormValues {
  const values: FormValues = {
    name: item.name,
    category: text(item.category),
    notes: text(item.notes),
    emoji: text(item.emoji),
    useDefaultOffsets: item.reminderOffsets === null ? "on" : "",
    offsets: (item.reminderOffsets ?? []).map(String),
  };

  switch (item.kind) {
    case "subscription":
      return {
        ...values,
        price: amountText(item.priceMinor, item.currency),
        currency: text(item.currency),
        billingCycle: text(item.billingCycle),
        cycleDays: text(item.cycleDays),
        nextBillingDate: text(item.dueDate),
        paymentMethod: text(item.paymentMethod),
        autoRenew: item.autoRenew ? "on" : "",
        cancelUrl: text(item.cancelUrl),
      };
    case "recurring":
      return {
        ...values,
        lastPurchasedOn: text(item.lastPurchasedOn),
        durationDays: text(item.durationDays),
        usualPrice: amountText(item.usualPriceMinor, item.usualCurrency),
        usualCurrency: text(item.usualCurrency),
        usualStore: text(item.usualStore),
        usualQuantity: text(item.usualQuantity),
      };
    case "warranty":
      return {
        ...values,
        purchasedOn: text(item.purchasedOn),
        warrantyMonths: text(item.warrantyMonths),
        serialNumber: text(item.serialNumber),
      };
    case "reminder":
      return {
        ...values,
        date: text(item.dueDate),
        repeat: text(item.billingCycle),
        cycleDays: text(item.cycleDays),
      };
    case "savings":
      return {
        ...values,
        currency: text(item.currency),
        targetAmount: amountText(item.targetMinor, item.currency),
        deadline: text(item.dueDate),
      };
  }
}

export interface CreateDefaults {
  today: string;
  currency: string;
}

/** Sensible starting values for the create form. */
export function createFormValues(kind: Item["kind"], defaults: CreateDefaults): FormValues {
  const base: FormValues = { useDefaultOffsets: "on", offsets: [] };
  switch (kind) {
    case "subscription":
      return { ...base, currency: defaults.currency, billingCycle: "monthly", autoRenew: "on" };
    case "recurring":
      return { ...base, lastPurchasedOn: defaults.today, usualCurrency: defaults.currency };
    case "warranty":
      return { ...base, purchasedOn: defaults.today };
    case "reminder":
      return { ...base, date: defaults.today, repeat: "" };
    case "savings":
      return { ...base, currency: defaults.currency };
  }
}
