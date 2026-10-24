import { describe, expect, it } from "vitest";
import {
  adjustmentFor,
  canWithdraw,
  computeSavings,
  deadlineText,
  savingsAriaLabel,
} from "./savings";

const TODAY = "2026-10-24";

describe("computeSavings progress", () => {
  it("computes fraction, percent and remaining for a goal in progress", () => {
    const p = computeSavings({ targetMinor: 50_000_000, savedMinor: 12_500_000, deadline: null }, TODAY);
    expect(p.fraction).toBe(0.25);
    expect(p.percent).toBe(25);
    expect(p.remainingMinor).toBe(37_500_000);
    expect(p.state).toBe("in_progress");
    expect(p.completed).toBe(false);
  });

  it("rounds the percent down so it never claims more than saved", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 999, deadline: null }, TODAY);
    expect(p.percent).toBe(99);
    expect(p.state).toBe("in_progress");
    expect(computeSavings({ targetMinor: 3, savedMinor: 1, deadline: null }, TODAY).percent).toBe(33);
  });

  it("starts at zero", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 0, deadline: null }, TODAY);
    expect(p.percent).toBe(0);
    expect(p.fraction).toBe(0);
    expect(p.remainingMinor).toBe(1000);
  });

  it("is completed at exactly the target", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 1000, deadline: null }, TODAY);
    expect(p.completed).toBe(true);
    expect(p.state).toBe("completed");
    expect(p.percent).toBe(100);
    expect(p.remainingMinor).toBe(0);
  });

  it("caps the bar at 100% when the goal is exceeded", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 1500, deadline: null }, TODAY);
    expect(p.fraction).toBe(1);
    expect(p.percent).toBe(100);
    expect(p.remainingMinor).toBe(0);
    expect(p.savedMinor).toBe(1500);
  });

  it("treats a negative saved amount as zero and rejects a bad target", () => {
    expect(computeSavings({ targetMinor: 1000, savedMinor: -5, deadline: null }, TODAY).savedMinor).toBe(0);
    expect(() => computeSavings({ targetMinor: 0, savedMinor: 0, deadline: null }, TODAY)).toThrow(RangeError);
    expect(() => computeSavings({ targetMinor: -1, savedMinor: 0, deadline: null }, TODAY)).toThrow(RangeError);
  });
});

describe("deadlines and the monthly amount needed", () => {
  it("spreads the remaining amount over the months left, rounding up", () => {
    // 10 million left, 92 days = 4 months (92 / 30.4375 = 3.02, rounded up)
    const p = computeSavings(
      { targetMinor: 12_000_000, savedMinor: 2_000_000, deadline: "2027-01-24" },
      TODAY,
    );
    expect(p.daysToDeadline).toBe(92);
    expect(p.neededPerMonthMinor).toBe(2_500_000);
  });

  it("never divides by less than one month", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 0, deadline: "2026-10-27" }, TODAY);
    expect(p.daysToDeadline).toBe(3);
    expect(p.neededPerMonthMinor).toBe(1000);
  });

  it("needs the whole remainder on the deadline day", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 400, deadline: TODAY }, TODAY);
    expect(p.daysToDeadline).toBe(0);
    expect(p.neededPerMonthMinor).toBe(600);
    expect(p.state).toBe("in_progress");
  });

  it("rounds the monthly amount up so the goal is not missed by a rupiah", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 0, deadline: "2026-12-30" }, TODAY);
    // 67 days -> 3 months -> 333.33 -> 334
    expect(p.neededPerMonthMinor).toBe(334);
  });

  it("has no monthly amount without a deadline or once completed", () => {
    expect(computeSavings({ targetMinor: 1000, savedMinor: 0, deadline: null }, TODAY).neededPerMonthMinor).toBeNull();
    expect(computeSavings({ targetMinor: 1000, savedMinor: 1000, deadline: "2027-01-01" }, TODAY).neededPerMonthMinor).toBeNull();
  });

  it("is overdue when the deadline passed and the goal is not reached", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 500, deadline: "2026-10-20" }, TODAY);
    expect(p.state).toBe("overdue");
    expect(p.daysToDeadline).toBe(-4);
    expect(p.neededPerMonthMinor).toBeNull();
  });

  it("stays completed, not overdue, when the goal was reached before the deadline passed", () => {
    const p = computeSavings({ targetMinor: 1000, savedMinor: 1000, deadline: "2026-10-20" }, TODAY);
    expect(p.state).toBe("completed");
  });
});

describe("withdrawals and corrections", () => {
  it("allows withdrawing up to the saved amount only", () => {
    expect(canWithdraw(1000, 1000)).toBe(true);
    expect(canWithdraw(1000, 1)).toBe(true);
    expect(canWithdraw(1000, 1001)).toBe(false);
    expect(canWithdraw(0, 1)).toBe(false);
  });

  it("rejects zero, negative and fractional withdrawals", () => {
    expect(canWithdraw(1000, 0)).toBe(false);
    expect(canWithdraw(1000, -5)).toBe(false);
    expect(canWithdraw(1000, 2.5)).toBe(false);
  });

  it("computes the adjustment that sets the total", () => {
    expect(adjustmentFor(800, 1000)).toBe(200);
    expect(adjustmentFor(800, 500)).toBe(-300);
    expect(adjustmentFor(800, 800)).toBe(0);
    expect(() => adjustmentFor(800, -1)).toThrow(RangeError);
    expect(() => adjustmentFor(800, 1.5)).toThrow(RangeError);
  });
});

describe("text", () => {
  it("describes deadlines", () => {
    expect(deadlineText(null)).toBe("No deadline");
    expect(deadlineText(92)).toBe("92 days to the deadline");
    expect(deadlineText(1)).toBe("1 day to the deadline");
    expect(deadlineText(0)).toBe("Deadline is today");
    expect(deadlineText(-1)).toBe("Deadline passed 1 day ago");
    expect(deadlineText(-4)).toBe("Deadline passed 4 days ago");
  });

  it("builds an accessible label with percent, amounts and status in words", () => {
    const p = computeSavings({ targetMinor: 50_000_000, savedMinor: 12_500_000, deadline: null }, TODAY);
    const label = savingsAriaLabel("Dana darurat", p, "IDR").replace(/\s/g, " ");
    expect(label).toBe("Dana darurat, 25 percent saved, Rp 12.500.000 of Rp 50.000.000, status: Saving");
  });
});
