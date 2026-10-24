import { describe, expect, it } from "vitest";
import { averageIntervalDays, purchaseIntervals, suggestEstimate } from "./interval";

describe("purchaseIntervals", () => {
  it("returns gaps between consecutive purchases, whatever the input order", () => {
    expect(purchaseIntervals(["2026-10-10", "2026-09-10", "2026-08-31"])).toEqual([10, 30]);
  });

  it("ignores duplicate dates", () => {
    expect(purchaseIntervals(["2026-10-10", "2026-10-10", "2026-10-20"])).toEqual([10]);
  });

  it("is empty for zero or one purchase", () => {
    expect(purchaseIntervals([])).toEqual([]);
    expect(purchaseIntervals(["2026-10-10"])).toEqual([]);
  });
});

describe("averageIntervalDays", () => {
  it("needs at least 3 purchases", () => {
    expect(averageIntervalDays(["2026-09-01", "2026-09-15"])).toBeNull();
    expect(averageIntervalDays(["2026-09-01", "2026-09-01", "2026-09-15"])).toBeNull();
  });

  it("averages the real gaps", () => {
    expect(averageIntervalDays(["2026-09-01", "2026-09-13", "2026-09-27"])).toBe(13);
  });
});

describe("suggestEstimate", () => {
  const coffee = ["2026-09-08", "2026-09-20", "2026-10-02", "2026-10-14"]; // every 12 days

  it("suggests a new estimate when the real interval differs by 10% or more", () => {
    expect(suggestEstimate(coffee, 14)).toEqual({
      currentDays: 14,
      averageDays: 12,
      suggestedDays: 12,
      purchases: 4,
    });
  });

  it("stays quiet with fewer than 3 purchases", () => {
    expect(suggestEstimate(["2026-09-08", "2026-10-02"], 14)).toBeNull();
  });

  it("stays quiet when the estimate is already close", () => {
    // 13 vs 14 is a 7% difference.
    expect(suggestEstimate(["2026-09-01", "2026-09-14", "2026-09-27"], 14)).toBeNull();
  });

  it("suggests at exactly 10%", () => {
    // average 9 vs estimate 10 is exactly 10%.
    const result = suggestEstimate(["2026-09-01", "2026-09-10", "2026-09-19"], 10);
    expect(result?.suggestedDays).toBe(9);
  });

  it("stays quiet when the rounded average equals the estimate", () => {
    expect(suggestEstimate(["2026-09-01", "2026-09-15", "2026-09-29"], 14)).toBeNull();
  });

  it("suggests a longer estimate when purchases are further apart", () => {
    const result = suggestEstimate(["2026-06-01", "2026-07-20", "2026-09-07"], 30);
    expect(result?.suggestedDays).toBe(49);
  });

  it("rounds the suggestion and never goes below 1 day", () => {
    const result = suggestEstimate(["2026-09-01", "2026-09-02", "2026-09-04"], 10);
    expect(result?.suggestedDays).toBe(2); // average 1.5 rounds to 2
    expect(suggestEstimate(["2026-09-01", "2026-09-02", "2026-09-03"], 10)?.suggestedDays).toBe(1);
  });

  it("does not suggest anything for an invalid current estimate", () => {
    expect(suggestEstimate(coffee, 0)).toBeNull();
  });
});
