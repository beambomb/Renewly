import type { BillingCycle } from "@/lib/dates/billing";
import type { ItemStatus } from "@/lib/rings/ring";

/** Average days in a month used to normalise custom N-day cycles. */
export const DAYS_PER_MONTH = 365.25 / 12;

export interface CostItem {
  kind: string;
  status: ItemStatus;
  /** Price in the currency's minor units (cents; yen for JPY). */
  priceMinor: number | null;
  currency: string | null;
  billingCycle: BillingCycle | null;
  cycleDays: number | null;
}

export interface CurrencyTotal {
  currency: string;
  /** Monthly total in minor units, rounded once at the end. */
  monthlyMinor: number;
}

/** Monthly cost in minor units, not rounded. Weekly x 52/12, yearly /12, custom N days x 30.4375/N. */
export function monthlyMinor(
  priceMinor: number,
  cycle: BillingCycle,
  cycleDays?: number | null,
): number {
  switch (cycle) {
    case "monthly":
      return priceMinor;
    case "weekly":
      return (priceMinor * 52) / 12;
    case "yearly":
      return priceMinor / 12;
    case "custom": {
      if (!cycleDays || cycleDays < 1) {
        throw new RangeError("Custom billing cycle needs a number of days (1 or more)");
      }
      return (priceMinor * DAYS_PER_MONTH) / cycleDays;
    }
  }
}

/** Only active subscriptions count. One total per currency; no conversion. */
export function monthlyTotals(items: readonly CostItem[]): CurrencyTotal[] {
  const sums = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== "subscription" || item.status !== "active") continue;
    if (item.priceMinor === null || !item.currency || !item.billingCycle) continue;
    const monthly = monthlyMinor(item.priceMinor, item.billingCycle, item.cycleDays);
    sums.set(item.currency, (sums.get(item.currency) ?? 0) + monthly);
  }
  return [...sums.entries()]
    .map(([currency, total]) => ({ currency, monthlyMinor: Math.round(total) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

/** Number of minor-unit digits for a currency (2 for USD, 0 for JPY, 3 for KWD). */
export function minorUnitDigits(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
}

export function minorToMajor(minor: number, currency: string): number {
  return minor / 10 ** minorUnitDigits(currency);
}

export function majorToMinor(major: number, currency: string): number {
  return Math.round(major * 10 ** minorUnitDigits(currency));
}

export function formatMoney(minor: number, currency: string, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    minorToMajor(minor, currency),
  );
}
