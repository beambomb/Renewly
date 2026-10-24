import { describe, expect, it } from "vitest";
import {
  billingDateAt,
  billingDatesBetween,
  billingWindow,
  nextBillingOnOrAfter,
  type BillingSchedule,
} from "./billing";

const monthly = (anchor: string): BillingSchedule => ({ cycle: "monthly", anchor });
const yearly = (anchor: string): BillingSchedule => ({ cycle: "yearly", anchor });
const custom = (anchor: string, cycleDays: number): BillingSchedule => ({ cycle: "custom", cycleDays, anchor });
const weekly = (anchor: string): BillingSchedule => ({ cycle: "weekly", anchor });

describe("monthly billing on the 29th, 30th and 31st", () => {
  it("keeps the 31st anchor through short months (non-leap year)", () => {
    const s = monthly("2026-01-31");
    expect([0, 1, 2, 3, 4, 5].map((n) => billingDateAt(s, n))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
    ]);
  });

  it("uses 29 Feb in a leap year", () => {
    const s = monthly("2028-01-31");
    expect(billingDateAt(s, 1)).toBe("2028-02-29");
    expect(billingDateAt(s, 2)).toBe("2028-03-31");
  });

  it("handles the 30th", () => {
    const s = monthly("2026-01-30");
    expect(billingDateAt(s, 1)).toBe("2026-02-28");
    expect(billingDateAt(s, 2)).toBe("2026-03-30");
    expect(billingDateAt(monthly("2028-01-30"), 1)).toBe("2028-02-29");
  });

  it("handles the 29th", () => {
    expect(billingDateAt(monthly("2026-01-29"), 1)).toBe("2026-02-28");
    expect(billingDateAt(monthly("2026-01-29"), 2)).toBe("2026-03-29");
    expect(billingDateAt(monthly("2028-01-29"), 1)).toBe("2028-02-29");
  });

  it("finds the next billing date from a later today without drifting", () => {
    const s = monthly("2026-01-31");
    expect(nextBillingOnOrAfter(s, "2026-02-01")).toBe("2026-02-28");
    expect(nextBillingOnOrAfter(s, "2026-02-28")).toBe("2026-02-28");
    expect(nextBillingOnOrAfter(s, "2026-03-01")).toBe("2026-03-31");
    expect(nextBillingOnOrAfter(s, "2026-04-30")).toBe("2026-04-30");
    expect(nextBillingOnOrAfter(s, "2026-12-01")).toBe("2026-12-31");
    expect(nextBillingOnOrAfter(s, "2028-02-10")).toBe("2028-02-29");
  });

  it("rolls forward after many missed cycles", () => {
    expect(nextBillingOnOrAfter(monthly("2024-05-15"), "2026-10-24")).toBe("2026-11-15");
    expect(nextBillingOnOrAfter(monthly("2024-05-15"), "2026-10-15")).toBe("2026-10-15");
  });

  it("works when today is before the anchor", () => {
    expect(nextBillingOnOrAfter(monthly("2026-12-31"), "2026-10-24")).toBe("2026-10-31");
    expect(nextBillingOnOrAfter(monthly("2026-12-31"), "2026-11-30")).toBe("2026-11-30");
  });
});

describe("yearly billing", () => {
  it("moves a 29 Feb anchor to 28 Feb in non-leap years", () => {
    const s = yearly("2028-02-29");
    expect(billingDateAt(s, 1)).toBe("2029-02-28");
    expect(billingDateAt(s, 2)).toBe("2030-02-28");
    expect(billingDateAt(s, 3)).toBe("2031-02-28");
  });

  it("returns to 29 Feb in the next leap year", () => {
    expect(billingDateAt(yearly("2028-02-29"), 4)).toBe("2032-02-29");
  });

  it("finds the next yearly date around the leap day", () => {
    const s = yearly("2028-02-29");
    expect(nextBillingOnOrAfter(s, "2028-03-01")).toBe("2029-02-28");
    expect(nextBillingOnOrAfter(s, "2029-02-28")).toBe("2029-02-28");
    expect(nextBillingOnOrAfter(s, "2031-03-01")).toBe("2032-02-29");
    expect(nextBillingOnOrAfter(s, "2032-02-29")).toBe("2032-02-29");
  });

  it("handles an ordinary date", () => {
    const s = yearly("2025-10-24");
    expect(nextBillingOnOrAfter(s, "2026-10-24")).toBe("2026-10-24");
    expect(nextBillingOnOrAfter(s, "2026-10-25")).toBe("2027-10-24");
  });
});

describe("weekly and custom N-day cycles", () => {
  it("steps weekly", () => {
    const s = weekly("2026-10-24");
    expect(billingDateAt(s, 1)).toBe("2026-10-31");
    expect(nextBillingOnOrAfter(s, "2026-11-01")).toBe("2026-11-07");
  });

  it("steps by N days across month and year ends", () => {
    const s = custom("2026-12-20", 28);
    expect(billingDateAt(s, 1)).toBe("2027-01-17");
    expect(billingDateAt(s, -1)).toBe("2026-11-22");
  });

  it("supports every day and very long cycles", () => {
    expect(nextBillingOnOrAfter(custom("2026-10-24", 1), "2026-10-30")).toBe("2026-10-30");
    expect(nextBillingOnOrAfter(custom("2026-10-24", 3650), "2026-10-25")).toBe("2036-10-21");
  });

  it("is not changed by daylight saving (calendar arithmetic)", () => {
    // A 14-day cycle that crosses the EU and US clock changes.
    const s = custom("2026-03-20", 14);
    expect(billingDateAt(s, 1)).toBe("2026-04-03");
    expect(billingDateAt(s, 2)).toBe("2026-04-17");
  });

  it("rejects an invalid cycle length", () => {
    expect(() => nextBillingOnOrAfter(custom("2026-10-24", 0), "2026-10-24")).toThrow(RangeError);
    expect(() => nextBillingOnOrAfter({ cycle: "custom", anchor: "2026-10-24" }, "2026-10-24")).toThrow(RangeError);
    expect(() => nextBillingOnOrAfter(custom("2026-10-24", 2.5), "2026-10-24")).toThrow(RangeError);
  });
});

describe("billingWindow", () => {
  it("returns the surrounding period", () => {
    expect(billingWindow(monthly("2026-11-15"), "2026-10-24")).toEqual({
      periodStart: "2026-10-15",
      dueDate: "2026-11-15",
    });
  });

  it("on the billing day the due date is today", () => {
    expect(billingWindow(monthly("2026-10-24"), "2026-10-24")).toEqual({
      periodStart: "2026-09-24",
      dueDate: "2026-10-24",
    });
  });

  it("uses the clamped previous date for a 31st anchor", () => {
    expect(billingWindow(monthly("2026-01-31"), "2026-03-10")).toEqual({
      periodStart: "2026-02-28",
      dueDate: "2026-03-31",
    });
  });

  it("works for yearly and custom cycles", () => {
    expect(billingWindow(yearly("2027-02-28"), "2026-10-24")).toEqual({
      periodStart: "2026-02-28",
      dueDate: "2027-02-28",
    });
    expect(billingWindow(custom("2026-10-30", 28), "2026-10-24")).toEqual({
      periodStart: "2026-10-02",
      dueDate: "2026-10-30",
    });
  });
});

describe("billingDatesBetween (missed auto-renewals)", () => {
  it("lists renewals after a date up to and including today", () => {
    expect(billingDatesBetween(monthly("2026-07-15"), "2026-07-15", "2026-10-24")).toEqual([
      "2026-08-15",
      "2026-09-15",
      "2026-10-15",
    ]);
  });

  it("returns nothing when nothing was missed", () => {
    expect(billingDatesBetween(monthly("2026-11-15"), "2026-10-15", "2026-10-24")).toEqual([]);
  });

  it("includes today when today is a billing day", () => {
    expect(billingDatesBetween(weekly("2026-10-10"), "2026-10-10", "2026-10-24")).toEqual([
      "2026-10-17",
      "2026-10-24",
    ]);
  });
});
