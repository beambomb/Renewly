import { describe, expect, it } from "vitest";
import { deriveColumns } from "./derive";
import type { ItemInput } from "./types";

const TODAY = "2026-10-24";
const common = { name: "x", category: null, notes: null, emoji: null, reminderOffsets: null };

const subscription = (overrides: Partial<Extract<ItemInput, { kind: "subscription" }>> = {}): ItemInput => ({
  kind: "subscription",
  ...common,
  priceMinor: 1000,
  currency: "USD",
  billingCycle: "monthly",
  cycleDays: null,
  nextBillingDate: "2026-11-12",
  paymentMethod: null,
  autoRenew: true,
  cancelUrl: null,
  ...overrides,
});

describe("subscription", () => {
  it("uses the entered next billing date and the previous cycle as the period start", () => {
    const d = deriveColumns(subscription(), { today: TODAY });
    expect(d.due_date).toBe("2026-11-12");
    expect(d.period_start).toBe("2026-10-12");
    expect(d.extra).toEqual({ billing_anchor_day: 12 });
  });

  it("keeps a far-future next billing date instead of pulling it earlier", () => {
    const d = deriveColumns(subscription({ nextBillingDate: "2027-01-15" }), { today: TODAY });
    expect(d.due_date).toBe("2027-01-15");
    expect(d.period_start).toBe("2026-12-15");
  });

  it("rolls an auto-renewing subscription forward when its date already passed", () => {
    const d = deriveColumns(subscription({ nextBillingDate: "2026-07-15" }), { today: TODAY });
    expect(d.due_date).toBe("2026-11-15");
    expect(d.period_start).toBe("2026-10-15");
  });

  it("leaves a non-auto-renewing subscription overdue on its entered date", () => {
    const d = deriveColumns(subscription({ nextBillingDate: "2026-10-21", autoRenew: false }), { today: TODAY });
    expect(d.due_date).toBe("2026-10-21");
    expect(d.period_start).toBe("2026-09-21");
  });

  it("remembers the 31st as the anchor day even for a February date", () => {
    const d = deriveColumns(subscription({ nextBillingDate: "2027-01-31" }), { today: TODAY });
    expect(d.extra).toEqual({ billing_anchor_day: 31 });
    expect(d.period_start).toBe("2026-12-31");
  });

  it("handles weekly, yearly and custom cycles", () => {
    expect(deriveColumns(subscription({ billingCycle: "weekly", nextBillingDate: "2026-10-31" }), { today: TODAY })).toMatchObject({
      period_start: "2026-10-24",
      due_date: "2026-10-31",
      extra: { billing_anchor_day: null },
    });
    expect(deriveColumns(subscription({ billingCycle: "yearly", nextBillingDate: "2027-02-28" }), { today: TODAY })).toMatchObject({
      period_start: "2026-02-28",
      extra: { billing_anchor_day: 28 },
    });
    expect(
      deriveColumns(subscription({ billingCycle: "custom", cycleDays: 28, nextBillingDate: "2026-11-05" }), { today: TODAY }),
    ).toMatchObject({ period_start: "2026-10-08", due_date: "2026-11-05" });
  });
});

describe("recurring purchase", () => {
  it("starts at the last purchase and ends after the estimated duration", () => {
    const input: ItemInput = {
      kind: "recurring",
      ...common,
      lastPurchasedOn: "2026-10-14",
      durationDays: 14,
      usualPriceMinor: null,
      usualCurrency: null,
      usualStore: null,
      usualQuantity: null,
    };
    expect(deriveColumns(input, { today: TODAY })).toMatchObject({ period_start: "2026-10-14", due_date: "2026-10-28" });
  });
});

describe("warranty", () => {
  it("computes the expiry from the purchase date and months, clamping month ends", () => {
    const input: ItemInput = { kind: "warranty", ...common, purchasedOn: "2024-02-29", warrantyMonths: 12, serialNumber: null };
    const d = deriveColumns(input, { today: TODAY });
    expect(d.due_date).toBe("2025-02-28");
    expect(d.extra).toEqual({ expires_on: "2025-02-28" });
    expect(d.period_start).toBe("2024-02-29");
  });

  it("handles long warranties", () => {
    const input: ItemInput = { kind: "warranty", ...common, purchasedOn: "2025-09-20", warrantyMonths: 36, serialNumber: null };
    expect(deriveColumns(input, { today: TODAY }).due_date).toBe("2028-09-20");
  });
});

describe("reminder", () => {
  const reminder = (overrides: Partial<Extract<ItemInput, { kind: "reminder" }>> = {}): ItemInput => ({
    kind: "reminder",
    ...common,
    date: "2026-12-31",
    repeat: null,
    cycleDays: null,
    ...overrides,
  });

  it("starts a one-off reminder today", () => {
    expect(deriveColumns(reminder(), { today: TODAY })).toMatchObject({ period_start: TODAY, due_date: "2026-12-31" });
  });

  it("keeps the original start when editing a one-off", () => {
    const d = deriveColumns(reminder(), { today: TODAY, previousPeriodStart: "2026-09-01" });
    expect(d.period_start).toBe("2026-09-01");
  });

  it("ignores a previous start that is after the new date", () => {
    const d = deriveColumns(reminder({ date: "2026-10-30" }), { today: TODAY, previousPeriodStart: "2026-11-15" });
    expect(d.period_start).toBe(TODAY);
  });

  it("never starts after its own date (a past one-off)", () => {
    const d = deriveColumns(reminder({ date: "2026-10-20" }), { today: TODAY });
    expect(d.period_start).toBe("2026-10-20");
    expect(d.due_date).toBe("2026-10-20");
  });

  it("uses the previous occurrence as the start of a repeating reminder", () => {
    const d = deriveColumns(reminder({ date: "2026-11-05", repeat: "monthly" }), { today: TODAY });
    expect(d).toMatchObject({ period_start: "2026-10-05", due_date: "2026-11-05", extra: { billing_anchor_day: 5 } });
  });

  it("supports custom day repeats and does not roll an overdue reminder forward", () => {
    const d = deriveColumns(reminder({ date: "2026-10-20", repeat: "custom", cycleDays: 10 }), { today: TODAY });
    expect(d).toMatchObject({ period_start: "2026-10-10", due_date: "2026-10-20" });
  });
});

describe("savings goal", () => {
  const goal = (deadline: string | null): ItemInput => ({
    kind: "savings",
    ...common,
    currency: "IDR",
    targetMinor: 1000,
    startingMinor: 0,
    deadline,
  });

  it("has no dates without a deadline", () => {
    expect(deriveColumns(goal(null), { today: TODAY })).toEqual({ period_start: null, due_date: null, extra: {} });
  });

  it("runs from today to the deadline", () => {
    expect(deriveColumns(goal("2027-06-30"), { today: TODAY })).toMatchObject({ period_start: TODAY, due_date: "2027-06-30" });
  });

  it("keeps the dates ordered for a deadline that already passed", () => {
    expect(deriveColumns(goal("2026-10-01"), { today: TODAY })).toMatchObject({ period_start: "2026-10-01", due_date: "2026-10-01" });
  });

  it("keeps the original start when the deadline is edited", () => {
    expect(deriveColumns(goal("2027-06-30"), { today: TODAY, previousPeriodStart: "2026-08-01" }).period_start).toBe("2026-08-01");
  });
});
