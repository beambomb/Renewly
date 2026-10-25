import { describe, expect, it } from "vitest";
import { sectionMonthlyCost, type SectionCostItem } from "./section-cost";

const base: SectionCostItem = {
  kind: "subscription",
  status: "active",
  priceMinor: null,
  currency: null,
  billingCycle: null,
  cycleDays: null,
  usualPriceMinor: null,
  usualCurrency: null,
  durationDays: null,
};

const sub = (overrides: Partial<SectionCostItem> = {}): SectionCostItem => ({
  ...base,
  priceMinor: 1000,
  currency: "USD",
  billingCycle: "monthly",
  ...overrides,
});

const recurring = (overrides: Partial<SectionCostItem> = {}): SectionCostItem => ({
  ...base,
  kind: "recurring",
  usualPriceMinor: 120000,
  usualCurrency: "IDR",
  durationDays: 14,
  ...overrides,
});

describe("subscriptions", () => {
  it("sums per currency across cycles, sorted by code, without converting", () => {
    const cost = sectionMonthlyCost("subscription", [
      sub({ priceMinor: 86000, currency: "IDR" }),
      sub({ priceMinor: 1200, currency: "USD", billingCycle: "weekly" }),
      sub({ priceMinor: 12000, currency: "EUR", billingCycle: "yearly" }),
      sub({ priceMinor: 3500, currency: "EUR", billingCycle: "custom", cycleDays: 28 }),
    ]);
    expect(cost).toEqual({
      totals: [
        { currency: "EUR", monthlyMinor: 1000 + Math.round((3500 * 30.4375) / 28) },
        { currency: "IDR", monthlyMinor: 86000 },
        { currency: "USD", monthlyMinor: 5200 },
      ],
      estimated: false,
    });
  });

  it("excludes paused and cancelled, keeps a free one at zero, skips incomplete rows, rounds once", () => {
    const cost = sectionMonthlyCost("subscription", [
      sub({ priceMinor: 100, billingCycle: "yearly" }),
      sub({ priceMinor: 100, billingCycle: "yearly" }),
      sub({ priceMinor: 100, billingCycle: "yearly" }),
      sub({ priceMinor: 9999, status: "paused" }),
      sub({ priceMinor: 9999, status: "cancelled" }),
      sub({ priceMinor: 0, currency: "EUR" }),
      sub({ priceMinor: null }),
    ]);
    expect(cost?.totals).toEqual([
      { currency: "EUR", monthlyMinor: 0 },
      { currency: "USD", monthlyMinor: 25 },
    ]);
  });
});

describe("garbage in, garbage out", () => {
  it("scales linearly with price and inversely with days, so a mistyped price or duration shows up as-is", () => {
    // 12,000.00 USD every 1 day (a rupiah-sized price saved under USD with a 1-day duration).
    const cost = sectionMonthlyCost("recurring", [recurring({ usualPriceMinor: 1_200_000, usualCurrency: "USD", durationDays: 1 })]);
    expect(cost).toEqual({ totals: [{ currency: "USD", monthlyMinor: 36_525_000 }], estimated: true });
    const sameRatio = sectionMonthlyCost("recurring", [recurring({ usualPriceMinor: 12_000_000, usualCurrency: "USD", durationDays: 10 })]);
    expect(sameRatio).toEqual(cost);
  });
});

describe("empty lists", () => {
  it("returns no totals for both costed kinds", () => {
    expect(sectionMonthlyCost("subscription", [])).toEqual({ totals: [], estimated: false });
    expect(sectionMonthlyCost("recurring", [])).toEqual({ totals: [], estimated: true });
  });
});

describe("recurring purchases", () => {
  it("estimates usual price x 30.4375 / days per currency", () => {
    const cost = sectionMonthlyCost("recurring", [
      recurring(),
      recurring({ usualPriceMinor: 2500, usualCurrency: "USD", durationDays: 30 }),
    ]);
    expect(cost).toEqual({
      totals: [
        { currency: "IDR", monthlyMinor: 260893 },
        { currency: "USD", monthlyMinor: Math.round((2500 * 30.4375) / 30) },
      ],
      estimated: true,
    });
  });

  it("ignores rows without a price, currency or a usable duration, and inactive ones", () => {
    const cost = sectionMonthlyCost("recurring", [
      recurring({ usualPriceMinor: null }),
      recurring({ usualCurrency: null }),
      recurring({ durationDays: 0 }),
      recurring({ durationDays: null }),
      recurring({ status: "paused" }),
    ]);
    expect(cost).toEqual({ totals: [], estimated: true });
  });

  it("ignores the usual quantity", () => {
    const withQuantity = { ...recurring(), usualQuantity: 3 };
    expect(sectionMonthlyCost("recurring", [withQuantity])).toEqual(sectionMonthlyCost("recurring", [recurring()]));
  });
});

describe("kind guard", () => {
  it("does not count recurring rows as subscriptions or the reverse", () => {
    expect(sectionMonthlyCost("subscription", [recurring()])?.totals).toEqual([]);
    expect(sectionMonthlyCost("recurring", [sub({ usualPriceMinor: 500, usualCurrency: "USD", durationDays: 10 })])?.totals).toEqual([]);
  });
});

describe("sections without a monthly cost", () => {
  it.each(["reminder", "savings", "warranty"] as const)("returns null for %s even with prices set", (kind) => {
    const item = { ...sub(), ...recurring(), kind, priceMinor: 1000, currency: "USD", billingCycle: "monthly" as const };
    expect(sectionMonthlyCost(kind, [item])).toBeNull();
  });
});
