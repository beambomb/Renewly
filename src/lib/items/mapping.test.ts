import { describe, expect, it } from "vitest";
import { ITEM_COLUMNS, inputToRow, rowToItem } from "./mapping";
import type { ItemInput } from "./types";

const TODAY = "2026-10-24";
const common = { name: "Thing", category: "Misc", notes: null, emoji: "🙂", reminderOffsets: [7, 1] };

describe("inputToRow", () => {
  it("maps a subscription and its derived dates, without user_id or saved_minor", () => {
    const input: ItemInput = {
      kind: "subscription",
      ...common,
      priceMinor: 1549,
      currency: "USD",
      billingCycle: "monthly",
      cycleDays: null,
      nextBillingDate: "2026-11-12",
      paymentMethod: "Visa",
      autoRenew: true,
      cancelUrl: null,
    };
    const row = inputToRow(input, { today: TODAY });
    expect(row).toMatchObject({
      kind: "subscription",
      name: "Thing",
      reminder_offsets: [7, 1],
      period_start: "2026-10-12",
      due_date: "2026-11-12",
      price_cents: 1549,
      currency: "USD",
      billing_cycle: "monthly",
      billing_anchor_day: 12,
      auto_renew: true,
    });
    expect(row).not.toHaveProperty("user_id");
    expect(row).not.toHaveProperty("saved_minor");
  });

  it("omits the kind when updating, since it never changes", () => {
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
    expect(inputToRow(input, { today: TODAY })).toHaveProperty("kind", "recurring");
    const update = inputToRow(input, { today: TODAY, includeKind: false });
    expect(update).not.toHaveProperty("kind");
    expect(update).toMatchObject({ due_date: "2026-10-28", last_purchased_on: "2026-10-14" });
  });

  it("maps a warranty with its computed expiry", () => {
    const input: ItemInput = { kind: "warranty", ...common, purchasedOn: "2025-09-20", warrantyMonths: 36, serialNumber: "SN" };
    expect(inputToRow(input, { today: TODAY })).toMatchObject({
      purchased_on: "2025-09-20",
      warranty_months: 36,
      expires_on: "2028-09-20",
      due_date: "2028-09-20",
      serial_number: "SN",
    });
  });

  it("maps a repeating reminder onto the billing columns", () => {
    const input: ItemInput = { kind: "reminder", ...common, date: "2026-11-05", repeat: "monthly", cycleDays: null };
    expect(inputToRow(input, { today: TODAY })).toMatchObject({
      billing_cycle: "monthly",
      billing_anchor_day: 5,
      due_date: "2026-11-05",
      period_start: "2026-10-05",
    });
    const oneOff: ItemInput = { kind: "reminder", ...common, date: "2026-11-05", repeat: null, cycleDays: null };
    expect(inputToRow(oneOff, { today: TODAY })).toMatchObject({ billing_cycle: null, cycle_days: null });
  });

  it("maps a savings goal and never sends the saved amount", () => {
    const input: ItemInput = {
      kind: "savings",
      ...common,
      currency: "IDR",
      targetMinor: 50_000_000,
      startingMinor: 12_500_000,
      deadline: null,
    };
    const row = inputToRow(input, { today: TODAY });
    expect(row).toMatchObject({ currency: "IDR", target_minor: 50_000_000, period_start: null, due_date: null });
    expect(row).not.toHaveProperty("saved_minor");
    expect(row).not.toHaveProperty("starting_minor");
  });
});

describe("rowToItem", () => {
  const blank = {
    id: "id-1",
    kind: "savings",
    name: "Dana darurat",
    category: null,
    notes: null,
    emoji: null,
    logo_path: null,
    status: "active",
    reminder_offsets: null,
    period_start: null,
    due_date: null,
    created_at: "2026-10-24T00:00:00Z",
    price_cents: null,
    currency: "IDR",
    billing_cycle: null,
    cycle_days: null,
    billing_anchor_day: null,
    payment_method: null,
    auto_renew: null,
    cancel_url: null,
    last_purchased_on: null,
    duration_days: null,
    usual_price_cents: null,
    usual_currency: null,
    usual_store: null,
    usual_quantity: null,
    purchased_on: null,
    warranty_months: null,
    expires_on: null,
    serial_number: null,
    receipt_path: null,
    target_minor: 50_000_000,
    saved_minor: 12_500_000,
  };

  it("maps a savings row", () => {
    expect(rowToItem(blank)).toMatchObject({
      id: "id-1",
      kind: "savings",
      targetMinor: 50_000_000,
      savedMinor: 12_500_000,
      periodStart: null,
      dueDate: null,
    });
  });

  it("converts numeric strings for large bigint values", () => {
    const item = rowToItem({ ...blank, target_minor: "5000000000", saved_minor: "1250000000" });
    expect(item.targetMinor).toBe(5_000_000_000);
    expect(item.savedMinor).toBe(1_250_000_000);
  });

  it("rejects an unknown kind or status", () => {
    expect(() => rowToItem({ ...blank, kind: "gadget" })).toThrow();
    expect(() => rowToItem({ ...blank, status: "deleted" })).toThrow();
  });

  it("selects exactly the columns the schema reads", () => {
    expect(ITEM_COLUMNS.split(", ")).toContain("saved_minor");
    expect(ITEM_COLUMNS.split(", ")).not.toContain("user_id");
    expect(Object.keys(blank).sort()).toEqual(ITEM_COLUMNS.split(", ").sort());
  });
});
