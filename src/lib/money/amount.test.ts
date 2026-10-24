import { describe, expect, it } from "vitest";
import { parseAmount } from "./amount";

const MAX = 1_000_000_000;

describe("parseAmount for rupiah (no decimals)", () => {
  it("reads plain digits and both grouping styles", () => {
    expect(parseAmount("50000000", "IDR", MAX)).toEqual({ minor: 50_000_000 });
    expect(parseAmount("12.500.000", "IDR", MAX)).toEqual({ minor: 12_500_000 });
    expect(parseAmount("12,500,000", "IDR", MAX)).toEqual({ minor: 12_500_000 });
    expect(parseAmount("1.000", "IDR", MAX)).toEqual({ minor: 1000 });
  });

  it("ignores an Rp prefix and spaces", () => {
    expect(parseAmount("Rp 12.500.000", "IDR", MAX)).toEqual({ minor: 12_500_000 });
    expect(parseAmount("rp. 2.000", "IDR", MAX)).toEqual({ minor: 2000 });
    expect(parseAmount(" 3 000 000 ", "IDR", MAX)).toEqual({ minor: 3_000_000 });
  });

  it("rejects decimals and malformed grouping", () => {
    expect(parseAmount("1.5", "IDR", MAX)).toEqual({ error: "decimals" });
    expect(parseAmount("12.50", "IDR", MAX)).toEqual({ error: "decimals" });
    expect(parseAmount("12.5000", "IDR", MAX)).toEqual({ error: "invalid" });
  });
});

describe("parseAmount for two-decimal currencies", () => {
  it("reads dot and comma decimals", () => {
    expect(parseAmount("9.99", "USD", MAX)).toEqual({ minor: 999 });
    expect(parseAmount("9,99", "USD", MAX)).toEqual({ minor: 999 });
    expect(parseAmount("15", "USD", MAX)).toEqual({ minor: 1500 });
    expect(parseAmount("0.5", "USD", MAX)).toEqual({ minor: 50 });
  });

  it("reads grouped amounts in either style", () => {
    expect(parseAmount("1,234.56", "USD", MAX)).toEqual({ minor: 123_456 });
    expect(parseAmount("1.234,56", "EUR", MAX)).toEqual({ minor: 123_456 });
    expect(parseAmount("1,234,567", "USD", MAX)).toEqual({ minor: 123_456_700 });
    expect(parseAmount("1.234", "USD", MAX)).toEqual({ minor: 123_400 });
  });

  it("rejects too many decimals and junk", () => {
    expect(parseAmount("9.999", "USD", MAX).hasOwnProperty("error")).toBe(false); // 3 digits after = thousands
    expect(parseAmount("9.9", "USD", MAX)).toEqual({ minor: 990 });
    expect(parseAmount("9.9999", "USD", MAX)).toEqual({ error: "decimals" });
    expect(parseAmount("abc", "USD", MAX)).toEqual({ error: "invalid" });
    expect(parseAmount("", "USD", MAX)).toEqual({ error: "invalid" });
    expect(parseAmount("-5", "USD", MAX)).toEqual({ error: "invalid" });
    expect(parseAmount("1e5", "USD", MAX)).toEqual({ error: "invalid" });
    expect(parseAmount(".", "USD", MAX)).toEqual({ error: "invalid" });
  });

  it("treats three digits after one separator as decimals for 3-decimal currencies", () => {
    expect(parseAmount("1.500", "KWD", MAX)).toEqual({ minor: 1500 });
  });
});

describe("limits", () => {
  it("rejects amounts above the maximum", () => {
    expect(parseAmount("1000000001", "IDR", MAX)).toEqual({ error: "range" });
    expect(parseAmount("1000000000", "IDR", MAX)).toEqual({ minor: 1_000_000_000 });
  });
});
