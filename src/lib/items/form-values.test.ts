import { describe, expect, it } from "vitest";
import { createFormValues, itemToFormValues } from "./form-values";
import type { Item } from "./types";

const blank: Item = {
  id: "id",
  kind: "subscription",
  name: "Thing",
  category: null,
  notes: null,
  emoji: null,
  logoPath: null,
  status: "active",
  reminderOffsets: null,
  periodStart: "2026-10-01",
  dueDate: "2026-11-01",
  createdAt: "2026-10-01T00:00:00Z",
  priceMinor: null,
  currency: null,
  billingCycle: null,
  cycleDays: null,
  billingAnchorDay: null,
  paymentMethod: null,
  autoRenew: null,
  cancelUrl: null,
  lastPurchasedOn: null,
  durationDays: null,
  usualPriceMinor: null,
  usualCurrency: null,
  usualStore: null,
  usualQuantity: null,
  purchasedOn: null,
  warrantyMonths: null,
  expiresOn: null,
  serialNumber: null,
  receiptPath: null,
  targetMinor: null,
  savedMinor: null,
};

describe("itemToFormValues", () => {
  it("turns a subscription into editable text, with major-unit prices", () => {
    const values = itemToFormValues({
      ...blank,
      priceMinor: 1549,
      currency: "USD",
      billingCycle: "monthly",
      autoRenew: true,
      paymentMethod: "Visa",
    });
    expect(values).toMatchObject({
      name: "Thing",
      price: "15.49",
      currency: "USD",
      billingCycle: "monthly",
      nextBillingDate: "2026-11-01",
      autoRenew: "on",
      paymentMethod: "Visa",
      useDefaultOffsets: "on",
      offsets: [],
    });
  });

  it("keeps custom reminder days and turns off the default box", () => {
    const values = itemToFormValues({ ...blank, reminderOffsets: [7, 1] });
    expect(values.useDefaultOffsets).toBe("");
    expect(values.offsets).toEqual(["7", "1"]);
  });

  it("writes rupiah as a plain whole number the parser accepts", () => {
    const values = itemToFormValues({
      ...blank,
      kind: "savings",
      currency: "IDR",
      targetMinor: 50_000_000,
      dueDate: null,
      periodStart: null,
    });
    expect(values).toMatchObject({ targetAmount: "50000000", currency: "IDR", deadline: "" });
  });

  it("maps recurring, warranty and reminder fields", () => {
    expect(
      itemToFormValues({
        ...blank,
        kind: "recurring",
        lastPurchasedOn: "2026-10-14",
        durationDays: 14,
        usualPriceMinor: 1299,
        usualCurrency: "USD",
        usualQuantity: 2.5,
      }),
    ).toMatchObject({ lastPurchasedOn: "2026-10-14", durationDays: "14", usualPrice: "12.99", usualQuantity: "2.5" });
    expect(
      itemToFormValues({ ...blank, kind: "warranty", purchasedOn: "2025-09-20", warrantyMonths: 36, serialNumber: "SN" }),
    ).toMatchObject({ purchasedOn: "2025-09-20", warrantyMonths: "36", serialNumber: "SN" });
    expect(
      itemToFormValues({ ...blank, kind: "reminder", billingCycle: "custom", cycleDays: 10, dueDate: "2026-12-01" }),
    ).toMatchObject({ date: "2026-12-01", repeat: "custom", cycleDays: "10" });
    expect(itemToFormValues({ ...blank, kind: "reminder", billingCycle: null }).repeat).toBe("");
  });
});

describe("createFormValues", () => {
  const defaults = { today: "2026-10-24", currency: "IDR" };

  it("starts each section with useful defaults", () => {
    expect(createFormValues("subscription", defaults)).toMatchObject({
      currency: "IDR",
      billingCycle: "monthly",
      autoRenew: "on",
      useDefaultOffsets: "on",
    });
    expect(createFormValues("recurring", defaults)).toMatchObject({ lastPurchasedOn: "2026-10-24", usualCurrency: "IDR" });
    expect(createFormValues("warranty", defaults)).toMatchObject({ purchasedOn: "2026-10-24" });
    expect(createFormValues("reminder", defaults)).toMatchObject({ date: "2026-10-24", repeat: "" });
    expect(createFormValues("savings", defaults)).toMatchObject({ currency: "IDR" });
  });
});
