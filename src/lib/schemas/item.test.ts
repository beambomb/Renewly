import { describe, expect, it } from "vitest";
import { parseItemForm } from "./item";

const TODAY = "2026-10-24";
const ctx = { today: TODAY };

function form(entries: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

const base = { name: "Thing", useDefaultOffsets: "on" };

describe("subscription form", () => {
  const valid = {
    ...base,
    name: "Netflix",
    price: "15.49",
    currency: "USD",
    billingCycle: "monthly",
    nextBillingDate: "2026-11-12",
    autoRenew: "on",
  };

  it("parses a complete subscription into minor units", () => {
    const result = parseItemForm("subscription", form(valid), ctx);
    expect(result.success).toBe(true);
    if (result.success && result.data.kind === "subscription") {
      expect(result.data).toMatchObject({
        name: "Netflix",
        priceMinor: 1549,
        currency: "USD",
        billingCycle: "monthly",
        cycleDays: null,
        nextBillingDate: "2026-11-12",
        autoRenew: true,
        reminderOffsets: null,
        cancelUrl: null,
      });
    }
  });

  it("understands Indonesian amounts for rupiah", () => {
    const result = parseItemForm("subscription", form({ ...valid, price: "Rp 186.000", currency: "IDR" }), ctx);
    expect(result.success && result.data.kind === "subscription" && result.data.priceMinor).toBe(186_000);
  });

  it("requires every key field and reports all problems at once", () => {
    const result = parseItemForm("subscription", form({ ...base, name: "", price: "abc", currency: "ZZZ" }), ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.map((x) => x.field)).toEqual(
        expect.arrayContaining(["name", "currency", "billingCycle", "nextBillingDate"]),
      );
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.values.name).toBe("");
    }
  });

  it("requires cycle days for a custom cycle, within 1 to 3650", () => {
    const missing = parseItemForm("subscription", form({ ...valid, billingCycle: "custom" }), ctx);
    expect(missing.success).toBe(false);
    const ok = parseItemForm("subscription", form({ ...valid, billingCycle: "custom", cycleDays: "28" }), ctx);
    expect(ok.success && ok.data.kind === "subscription" && ok.data.cycleDays).toBe(28);
    for (const cycleDays of ["0", "3651", "2.5", "abc"]) {
      expect(parseItemForm("subscription", form({ ...valid, billingCycle: "custom", cycleDays }), ctx).success).toBe(false);
    }
  });

  it("ignores cycle days for non-custom cycles", () => {
    const result = parseItemForm("subscription", form({ ...valid, cycleDays: "abc" }), ctx);
    expect(result.success).toBe(true);
  });

  it("accepts only https cancel links", () => {
    expect(parseItemForm("subscription", form({ ...valid, cancelUrl: "https://example.com/cancel" }), ctx).success).toBe(true);
    for (const cancelUrl of ["http://example.com", "javascript:alert(1)", "example.com", "https://a b.com"]) {
      const result = parseItemForm("subscription", form({ ...valid, cancelUrl }), ctx);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.map((x) => x.field)).toContain("cancelUrl");
    }
  });

  it("rejects an impossible date and too-long text", () => {
    expect(parseItemForm("subscription", form({ ...valid, nextBillingDate: "2026-02-30" }), ctx).success).toBe(false);
    expect(parseItemForm("subscription", form({ ...valid, name: "x".repeat(81) }), ctx).success).toBe(false);
    expect(parseItemForm("subscription", form({ ...valid, notes: "x".repeat(2001) }), ctx).success).toBe(false);
  });

  it("uses custom reminder days when the default box is off", () => {
    const result = parseItemForm(
      "subscription",
      form({ ...valid, useDefaultOffsets: "", offsets: ["1", "7", "7"] }),
      ctx,
    );
    // an empty string for the checkbox means unchecked in our parsing
    expect(result.success && result.data.reminderOffsets).toEqual([7, 1]);
  });

  it("rejects bad reminder days", () => {
    const result = parseItemForm("subscription", form({ ...valid, useDefaultOffsets: "", offsets: ["999"] }), ctx);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.map((x) => x.field)).toContain("offsets");
  });

  it("rejects a non-text field value such as a file", () => {
    const data = form(valid);
    data.set("name", new File(["x"], "x.txt"));
    expect(parseItemForm("subscription", data, ctx).success).toBe(false);
  });
});

describe("recurring purchase form", () => {
  const valid = { ...base, name: "Coffee beans", lastPurchasedOn: "2026-10-14", durationDays: "14" };

  it("parses with optional extras empty", () => {
    const result = parseItemForm("recurring", form(valid), ctx);
    expect(result.success && result.data).toMatchObject({
      kind: "recurring",
      lastPurchasedOn: "2026-10-14",
      durationDays: 14,
      usualPriceMinor: null,
      usualCurrency: null,
      usualStore: null,
      usualQuantity: null,
    });
  });

  it("parses usual price, store and quantity", () => {
    const result = parseItemForm(
      "recurring",
      form({ ...valid, usualPrice: "12,99", usualCurrency: "USD", usualStore: "Roastery", usualQuantity: "2,5" }),
      ctx,
    );
    expect(result.success && result.data).toMatchObject({
      usualPriceMinor: 1299,
      usualCurrency: "USD",
      usualStore: "Roastery",
      usualQuantity: 2.5,
    });
  });

  it("rejects a future purchase date but accepts today", () => {
    expect(parseItemForm("recurring", form({ ...valid, lastPurchasedOn: TODAY }), ctx).success).toBe(true);
    const future = parseItemForm("recurring", form({ ...valid, lastPurchasedOn: "2026-10-25" }), ctx);
    expect(future.success).toBe(false);
    if (!future.success) expect(future.errors[0]?.field).toBe("lastPurchasedOn");
  });

  it("validates duration and quantity", () => {
    for (const durationDays of ["", "0", "3651", "-3", "1.5"]) {
      expect(parseItemForm("recurring", form({ ...valid, durationDays }), ctx).success).toBe(false);
    }
    for (const usualQuantity of ["0", "-1", "abc", "1.234"]) {
      expect(parseItemForm("recurring", form({ ...valid, usualQuantity }), ctx).success).toBe(false);
    }
  });

  it("needs a valid currency when a usual price is given", () => {
    const result = parseItemForm("recurring", form({ ...valid, usualPrice: "5", usualCurrency: "" }), ctx);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.map((x) => x.field)).toContain("usualCurrency");
  });
});

describe("warranty form", () => {
  const valid = { ...base, name: "Laptop", purchasedOn: "2025-09-20", warrantyMonths: "36" };

  it("parses a warranty", () => {
    const result = parseItemForm("warranty", form({ ...valid, serialNumber: "SN-1" }), ctx);
    expect(result.success && result.data).toMatchObject({
      kind: "warranty",
      purchasedOn: "2025-09-20",
      warrantyMonths: 36,
      serialNumber: "SN-1",
    });
  });

  it("rejects a future purchase date and out-of-range months", () => {
    expect(parseItemForm("warranty", form({ ...valid, purchasedOn: "2027-01-01" }), ctx).success).toBe(false);
    for (const warrantyMonths of ["0", "601", "abc", ""]) {
      expect(parseItemForm("warranty", form({ ...valid, warrantyMonths }), ctx).success).toBe(false);
    }
  });
});

describe("reminder form", () => {
  const valid = { ...base, name: "Renew passport", date: "2026-12-31" };

  it("parses a one-off reminder", () => {
    const result = parseItemForm("reminder", form(valid), ctx);
    expect(result.success && result.data).toMatchObject({ kind: "reminder", date: "2026-12-31", repeat: null, cycleDays: null });
  });

  it("allows a date in the past (it shows as overdue)", () => {
    expect(parseItemForm("reminder", form({ ...valid, date: "2026-01-01" }), ctx).success).toBe(true);
  });

  it("parses repeats and requires days for a custom repeat", () => {
    const monthly = parseItemForm("reminder", form({ ...valid, repeat: "monthly" }), ctx);
    expect(monthly.success && monthly.data.kind === "reminder" && monthly.data.repeat).toBe("monthly");
    expect(parseItemForm("reminder", form({ ...valid, repeat: "custom" }), ctx).success).toBe(false);
    const custom = parseItemForm("reminder", form({ ...valid, repeat: "custom", cycleDays: "10" }), ctx);
    expect(custom.success && custom.data.kind === "reminder" && custom.data.cycleDays).toBe(10);
  });

  it("rejects an unknown repeat and a missing title or date", () => {
    expect(parseItemForm("reminder", form({ ...valid, repeat: "daily" }), ctx).success).toBe(false);
    expect(parseItemForm("reminder", form({ ...valid, name: "" }), ctx).success).toBe(false);
    expect(parseItemForm("reminder", form({ ...valid, date: "" }), ctx).success).toBe(false);
  });
});

describe("savings goal form", () => {
  const valid = { ...base, name: "Dana darurat", currency: "IDR", targetAmount: "50.000.000" };

  it("parses a goal with no deadline and nothing saved yet", () => {
    const result = parseItemForm("savings", form(valid), ctx);
    expect(result.success && result.data).toMatchObject({
      kind: "savings",
      currency: "IDR",
      targetMinor: 50_000_000,
      startingMinor: 0,
      deadline: null,
    });
  });

  it("parses an amount already saved and a deadline", () => {
    const result = parseItemForm("savings", form({ ...valid, startingAmount: "12.500.000", deadline: "2027-06-30" }), ctx);
    expect(result.success && result.data).toMatchObject({ startingMinor: 12_500_000, deadline: "2027-06-30" });
  });

  it("rejects a zero or missing target and bad deadline", () => {
    for (const targetAmount of ["0", "", "abc", "-5"]) {
      expect(parseItemForm("savings", form({ ...valid, targetAmount }), ctx).success).toBe(false);
    }
    expect(parseItemForm("savings", form({ ...valid, deadline: "2027-02-30" }), ctx).success).toBe(false);
  });

  it("rejects decimals for rupiah and bad starting amounts", () => {
    expect(parseItemForm("savings", form({ ...valid, targetAmount: "1.5" }), ctx).success).toBe(false);
    expect(parseItemForm("savings", form({ ...valid, startingAmount: "abc" }), ctx).success).toBe(false);
  });

  it("handles large amounts and an upper limit", () => {
    const big = parseItemForm("savings", form({ ...valid, targetAmount: "5000000000" }), ctx);
    expect(big.success && big.data.kind === "savings" && big.data.targetMinor).toBe(5_000_000_000);
    expect(parseItemForm("savings", form({ ...valid, targetAmount: "9999999999999" }), ctx).success).toBe(false);
  });

  it("works with other currencies", () => {
    const result = parseItemForm("savings", form({ ...valid, currency: "USD", targetAmount: "1,500.50" }), ctx);
    expect(result.success && result.data.kind === "savings" && result.data.targetMinor).toBe(150_050);
  });
});
