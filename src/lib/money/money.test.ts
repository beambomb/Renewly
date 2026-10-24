import { describe, expect, it } from "vitest";
import {
  formatMoney,
  majorToMinor,
  minorUnitDigits,
  monthlyMinor,
  monthlyTotals,
  type CostItem,
} from "./money";

const sub = (overrides: Partial<CostItem>): CostItem => ({
  kind: "subscription",
  status: "active",
  priceMinor: 1000,
  currency: "USD",
  billingCycle: "monthly",
  cycleDays: null,
  ...overrides,
});

describe("monthlyMinor", () => {
  it("keeps monthly as is", () => {
    expect(monthlyMinor(1549, "monthly")).toBe(1549);
  });

  it("converts yearly by dividing by 12", () => {
    expect(monthlyMinor(12000, "yearly")).toBe(1000);
    expect(monthlyMinor(13900, "yearly")).toBeCloseTo(1158.333, 3);
  });

  it("converts weekly by multiplying by 52/12", () => {
    expect(monthlyMinor(1200, "weekly")).toBeCloseTo(5200, 6);
  });

  it("converts custom N-day cycles using 30.4375 days a month", () => {
    expect(monthlyMinor(3500, "custom", 28)).toBeCloseTo((3500 * 30.4375) / 28, 6);
    expect(monthlyMinor(100, "custom", 1)).toBeCloseTo(3043.75, 6);
    expect(monthlyMinor(5000, "custom", 365)).toBeCloseTo((5000 * 30.4375) / 365, 6);
  });

  it("rejects a custom cycle without days", () => {
    expect(() => monthlyMinor(100, "custom", null)).toThrow(RangeError);
    expect(() => monthlyMinor(100, "custom", 0)).toThrow(RangeError);
  });
});

describe("monthlyTotals", () => {
  it("sums per currency without converting between them", () => {
    const totals = monthlyTotals([
      sub({ priceMinor: 1549 }),
      sub({ priceMinor: 12000, billingCycle: "yearly" }),
      sub({ priceMinor: 3500, currency: "EUR", billingCycle: "custom", cycleDays: 28 }),
    ]);
    expect(totals).toEqual([
      { currency: "EUR", monthlyMinor: Math.round((3500 * 30.4375) / 28) },
      { currency: "USD", monthlyMinor: 2549 },
    ]);
  });

  it("rounds once at the end, not per item", () => {
    // Three yearly 100-unit items: each is 8.33 monthly, together 25.
    const totals = monthlyTotals([
      sub({ priceMinor: 100, billingCycle: "yearly" }),
      sub({ priceMinor: 100, billingCycle: "yearly" }),
      sub({ priceMinor: 100, billingCycle: "yearly" }),
    ]);
    expect(totals).toEqual([{ currency: "USD", monthlyMinor: 25 }]);
  });

  it("ignores paused, cancelled and non-subscription items", () => {
    const totals = monthlyTotals([
      sub({ priceMinor: 1000 }),
      sub({ priceMinor: 999, status: "paused" }),
      sub({ priceMinor: 999, status: "cancelled" }),
      sub({ priceMinor: 999, kind: "recurring" }),
    ]);
    expect(totals).toEqual([{ currency: "USD", monthlyMinor: 1000 }]);
  });

  it("skips incomplete rows and handles an empty list", () => {
    expect(monthlyTotals([])).toEqual([]);
    expect(monthlyTotals([sub({ priceMinor: null }), sub({ currency: null })])).toEqual([]);
  });

  it("includes free subscriptions as zero without dropping the currency", () => {
    expect(monthlyTotals([sub({ priceMinor: 0 })])).toEqual([{ currency: "USD", monthlyMinor: 0 }]);
  });
});

describe("minor units and formatting", () => {
  it("knows currency digits", () => {
    expect(minorUnitDigits("USD")).toBe(2);
    expect(minorUnitDigits("JPY")).toBe(0);
    expect(minorUnitDigits("KWD")).toBe(3);
  });

  it("converts to and from minor units", () => {
    expect(majorToMinor(15.49, "USD")).toBe(1549);
    expect(majorToMinor(0.29, "USD")).toBe(29); // guards against 28.999999
    expect(majorToMinor(1200, "JPY")).toBe(1200);
    expect(majorToMinor(1.5, "KWD")).toBe(1500);
  });

  it("formats amounts", () => {
    expect(formatMoney(1549, "USD")).toBe("$15.49");
    expect(formatMoney(1200, "JPY")).toBe("¥1,200");
    expect(formatMoney(0, "EUR")).toBe("€0.00");
  });
});
