import type { ItemKind } from "@/lib/items/types";
import { DAYS_PER_MONTH, monthlyTotals, type CostItem, type CurrencyTotal } from "./money";

export interface SectionCostItem extends CostItem {
  usualPriceMinor: number | null;
  usualCurrency: string | null;
  durationDays: number | null;
}

export interface SectionCost {
  /** One total per currency, sorted by currency code. Never converted. */
  totals: CurrencyTotal[];
  /** True when the figure is a rough estimate rather than an exact charge. */
  estimated: boolean;
}

/**
 * Monthly cost of one home section, or null when the section has no recurring cost.
 * Uses only prices, cycles and day counts, so it takes no date and no timezone.
 */
export function sectionMonthlyCost(kind: ItemKind, items: readonly SectionCostItem[]): SectionCost | null {
  switch (kind) {
    case "subscription":
      return { totals: monthlyTotals(items), estimated: false };
    case "recurring":
      return { totals: recurringMonthlyTotals(items), estimated: true };
    default:
      return null;
  }
}

// The usual price is one purchase and durationDays is how long it lasts, so price x 30.4375 / days
// is the monthly spend. usualQuantity is ignored: it has no unit, so multiplying by it would be meaningless.
function recurringMonthlyTotals(items: readonly SectionCostItem[]): CurrencyTotal[] {
  const sums = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== "recurring" || item.status !== "active") continue;
    if (item.usualPriceMinor === null || !item.usualCurrency) continue;
    if (item.durationDays === null || item.durationDays < 1) continue;
    const monthly = (item.usualPriceMinor * DAYS_PER_MONTH) / item.durationDays;
    sums.set(item.usualCurrency, (sums.get(item.usualCurrency) ?? 0) + monthly);
  }
  return [...sums.entries()]
    .map(([currency, total]) => ({ currency, monthlyMinor: Math.round(total) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
