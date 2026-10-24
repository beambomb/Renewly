import type { BillingCycle } from "@/lib/dates/billing";
import type { CalendarDate } from "@/lib/dates/calendar";
import type { ItemKind, ItemStatus } from "@/lib/rings/ring";

export type { BillingCycle, ItemKind, ItemStatus };

/** The fixed sections, in the order they are offered. */
export const ITEM_KINDS: readonly ItemKind[] = ["subscription", "reminder", "savings", "recurring", "warranty"];
export const BILLING_CYCLES: readonly BillingCycle[] = ["weekly", "monthly", "yearly", "custom"];

export function isItemKind(value: unknown): value is ItemKind {
  return typeof value === "string" && (ITEM_KINDS as readonly string[]).includes(value);
}

/** An item as the app uses it (camelCase). Fields of other sections are null. */
export interface Item {
  id: string;
  kind: ItemKind;
  name: string;
  category: string | null;
  notes: string | null;
  emoji: string | null;
  logoPath: string | null;
  status: ItemStatus;
  /** null means use the profile default. */
  reminderOffsets: number[] | null;
  /** null only for savings goals without a deadline. */
  periodStart: CalendarDate | null;
  dueDate: CalendarDate | null;
  createdAt: string;

  // subscription (and the repeat of a reminder: billingCycle null = one-off)
  priceMinor: number | null;
  currency: string | null;
  billingCycle: BillingCycle | null;
  cycleDays: number | null;
  billingAnchorDay: number | null;
  paymentMethod: string | null;
  autoRenew: boolean | null;
  cancelUrl: string | null;

  // recurring purchase
  lastPurchasedOn: CalendarDate | null;
  durationDays: number | null;
  usualPriceMinor: number | null;
  usualCurrency: string | null;
  usualStore: string | null;
  usualQuantity: number | null;

  // warranty
  purchasedOn: CalendarDate | null;
  warrantyMonths: number | null;
  expiresOn: CalendarDate | null;
  serialNumber: string | null;
  receiptPath: string | null;

  // savings (the deadline is dueDate)
  targetMinor: number | null;
  savedMinor: number | null;
}

/** Validated form input, one shape per section. Dates are YYYY-MM-DD. */
interface CommonInput {
  name: string;
  category: string | null;
  notes: string | null;
  emoji: string | null;
  /** null means use the profile default. */
  reminderOffsets: number[] | null;
}

export interface SubscriptionInput extends CommonInput {
  kind: "subscription";
  priceMinor: number;
  currency: string;
  billingCycle: BillingCycle;
  cycleDays: number | null;
  nextBillingDate: CalendarDate;
  paymentMethod: string | null;
  autoRenew: boolean;
  cancelUrl: string | null;
}

export interface RecurringInput extends CommonInput {
  kind: "recurring";
  lastPurchasedOn: CalendarDate;
  durationDays: number;
  usualPriceMinor: number | null;
  usualCurrency: string | null;
  usualStore: string | null;
  usualQuantity: number | null;
}

export interface WarrantyInput extends CommonInput {
  kind: "warranty";
  purchasedOn: CalendarDate;
  warrantyMonths: number;
  serialNumber: string | null;
}

export interface ReminderInput extends CommonInput {
  kind: "reminder";
  /** The next date it is due. */
  date: CalendarDate;
  /** null means it does not repeat. */
  repeat: BillingCycle | null;
  cycleDays: number | null;
}

export interface SavingsGoalInput extends CommonInput {
  kind: "savings";
  currency: string;
  targetMinor: number;
  /** Recorded as the first deposit when the goal is created. */
  startingMinor: number;
  /** Optional target date. */
  deadline: CalendarDate | null;
}

export type ItemInput =
  | SubscriptionInput
  | RecurringInput
  | WarrantyInput
  | ReminderInput
  | SavingsGoalInput;
