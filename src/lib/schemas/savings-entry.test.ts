import { describe, expect, it } from "vitest";
import { parseSavingsEntryForm } from "./savings-entry";

const ctx = { currency: "IDR", savedMinor: 12_500_000, today: "2026-10-24" };

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

describe("deposit", () => {
  it("parses a positive deposit with Indonesian formatting", () => {
    const result = parseSavingsEntryForm(form({ action: "deposit", amount: "2.500.000", note: " Bonus " }), ctx);
    expect(result).toEqual({
      success: true,
      data: { entryType: "deposit", amountMinor: 2_500_000, occurredOn: "2026-10-24", note: "Bonus" },
    });
  });

  it("rejects zero, negative and missing amounts", () => {
    for (const amount of ["0", "-5", "", "abc"]) {
      expect(parseSavingsEntryForm(form({ action: "deposit", amount }), ctx).success).toBe(false);
    }
  });
});

describe("withdrawal", () => {
  it("stores withdrawals as negative amounts", () => {
    const result = parseSavingsEntryForm(form({ action: "withdraw", amount: "500000" }), ctx);
    expect(result.success && result.data).toMatchObject({ entryType: "withdrawal", amountMinor: -500_000 });
  });

  it("allows taking out everything but not more", () => {
    expect(parseSavingsEntryForm(form({ action: "withdraw", amount: "12.500.000" }), ctx).success).toBe(true);
    const tooMuch = parseSavingsEntryForm(form({ action: "withdraw", amount: "12.500.001" }), ctx);
    expect(tooMuch.success).toBe(false);
    if (!tooMuch.success) expect(tooMuch.errors[0]).toMatchObject({ field: "amount" });
  });
});

describe("correcting the total", () => {
  it("records the difference as a signed adjustment", () => {
    const up = parseSavingsEntryForm(form({ action: "correct", newTotal: "15.000.000" }), ctx);
    expect(up.success && up.data).toMatchObject({ entryType: "adjustment", amountMinor: 2_500_000 });
    const down = parseSavingsEntryForm(form({ action: "correct", newTotal: "10.000.000" }), ctx);
    expect(down.success && down.data).toMatchObject({ entryType: "adjustment", amountMinor: -2_500_000 });
  });

  it("allows setting the total to zero", () => {
    const result = parseSavingsEntryForm(form({ action: "correct", newTotal: "0" }), ctx);
    expect(result.success && result.data.amountMinor).toBe(-12_500_000);
  });

  it("rejects an unchanged total and invalid numbers", () => {
    expect(parseSavingsEntryForm(form({ action: "correct", newTotal: "12.500.000" }), ctx).success).toBe(false);
    expect(parseSavingsEntryForm(form({ action: "correct", newTotal: "-1" }), ctx).success).toBe(false);
    expect(parseSavingsEntryForm(form({ action: "correct", newTotal: "" }), ctx).success).toBe(false);
  });
});

describe("date, note and action", () => {
  it("defaults the date to today and accepts a past date", () => {
    const past = parseSavingsEntryForm(form({ action: "deposit", amount: "1000", occurredOn: "2026-10-01" }), ctx);
    expect(past.success && past.data.occurredOn).toBe("2026-10-01");
  });

  it("rejects future and invalid dates", () => {
    expect(parseSavingsEntryForm(form({ action: "deposit", amount: "1000", occurredOn: "2026-10-25" }), ctx).success).toBe(false);
    expect(parseSavingsEntryForm(form({ action: "deposit", amount: "1000", occurredOn: "2026-02-30" }), ctx).success).toBe(false);
  });

  it("rejects an unknown action and an over-long note, reporting both", () => {
    const result = parseSavingsEntryForm(form({ action: "steal", amount: "5", note: "x".repeat(201) }), ctx);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.map((x) => x.field)).toEqual(["action", "note"]);
  });

  it("works for currencies with decimals", () => {
    const usd = { currency: "USD", savedMinor: 10_000, today: "2026-10-24" };
    const result = parseSavingsEntryForm(form({ action: "deposit", amount: "12.34" }), usd);
    expect(result.success && result.data.amountMinor).toBe(1234);
  });
});
