import { describe, expect, it } from "vitest";
import type { Item } from "@/lib/items/types";
import { priceDetail } from "./entries";

const item = (fields: Partial<Item>) => fields as Item;
const nbsp = (text: unknown) => String(text).replace(/\s/g, " ");

describe("priceDetail", () => {
  it("keeps the subscription line as price per cycle", () => {
    const detail = priceDetail(item({ kind: "subscription", priceMinor: 86000, currency: "IDR", billingCycle: "monthly" }));
    expect(nbsp(detail)).toBe("Rp 86.000 per month");
  });

  it("adds the cadence to a recurring purchase", () => {
    const detail = priceDetail(item({ kind: "recurring", usualPriceMinor: 120000, usualCurrency: "IDR", durationDays: 14 }));
    expect(nbsp(detail)).toBe("Rp 120.000 every 14 days");
  });

  it("says every day for a one-day cadence, so a wrong duration is visible", () => {
    const detail = priceDetail(item({ kind: "recurring", usualPriceMinor: 1_200_000, usualCurrency: "USD", durationDays: 1 }));
    expect(detail).toBe("$12,000.00 every day");
  });

  it("falls back to the plain price without a duration", () => {
    const detail = priceDetail(item({ kind: "recurring", usualPriceMinor: 2500, usualCurrency: "USD", durationDays: null }));
    expect(detail).toBe("$25.00");
  });
});
