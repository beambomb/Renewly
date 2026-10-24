import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  daysInMonth,
  diffDays,
  fromEpochDay,
  isLeapYear,
  isValidDate,
  isValidTimeZone,
  localHourIn,
  parseDate,
  toEpochDay,
  todayIn,
} from "./calendar";

describe("leap years and month lengths", () => {
  it("knows leap years", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
  });

  it("knows month lengths", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe("parsing", () => {
  it("parses valid dates", () => {
    expect(parseDate("2026-10-24")).toEqual({ year: 2026, month: 10, day: 24 });
  });

  it("rejects impossible dates and bad formats", () => {
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2028-02-29")).toBe(true);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2026-4-1")).toBe(false);
    expect(isValidDate("not a date")).toBe(false);
    expect(() => parseDate("2026-02-30")).toThrow(RangeError);
  });
});

describe("day arithmetic", () => {
  it("round-trips epoch days", () => {
    expect(fromEpochDay(toEpochDay("2026-10-24"))).toBe("2026-10-24");
    expect(toEpochDay("1970-01-01")).toBe(0);
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("diffs days, negative when going back", () => {
    expect(diffDays("2026-10-24", "2026-11-03")).toBe(10);
    expect(diffDays("2026-11-03", "2026-10-24")).toBe(-10);
    expect(diffDays("2026-10-24", "2026-10-24")).toBe(0);
  });

  it("is not affected by daylight saving transitions", () => {
    // 23 and 25 hour local days still count as exactly one calendar day.
    expect(diffDays("2026-03-07", "2026-03-09")).toBe(2); // US spring forward on the 8th
    expect(diffDays("2026-11-01", "2026-11-02")).toBe(1); // US fall back on the 1st
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30"); // EU spring forward on the 29th
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26"); // EU fall back on the 25th
  });
});

describe("adding months", () => {
  it("clamps the 31st to short months and keeps the anchor", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-01-31", 2)).toBe("2026-03-31");
    expect(addMonths("2026-01-31", 3)).toBe("2026-04-30");
    expect(addMonths("2026-01-31", 5)).toBe("2026-06-30");
  });

  it("clamps the 29th and 30th", () => {
    expect(addMonths("2026-01-29", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-29", 1)).toBe("2028-02-29");
    expect(addMonths("2026-01-30", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-30", 1)).toBe("2028-02-29");
  });

  it("uses an explicit anchor day so it does not drift", () => {
    // Feb 28 is the clamped result of anchor 31; going forward returns to the 31st.
    expect(addMonths("2026-02-28", 1, 31)).toBe("2026-03-31");
    expect(addMonths("2026-04-30", 1, 31)).toBe("2026-05-31");
  });

  it("crosses year boundaries in both directions", () => {
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonths("2026-02-15", -3)).toBe("2025-11-15");
    expect(addMonths("2026-01-31", -2)).toBe("2025-11-30");
    expect(addMonths("2026-06-10", 24)).toBe("2028-06-10");
    expect(addMonths("2026-06-10", -24)).toBe("2024-06-10");
  });
});

describe("adding years", () => {
  it("moves 29 Feb to 28 Feb in non-leap years", () => {
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28");
    expect(addYears("2028-02-29", 3)).toBe("2031-02-28");
  });

  it("returns to 29 Feb in leap years when anchored", () => {
    expect(addYears("2028-02-29", 4)).toBe("2032-02-29");
    expect(addYears("2029-02-28", 3, 29)).toBe("2032-02-29");
  });

  it("goes backwards", () => {
    expect(addYears("2028-02-29", -1)).toBe("2027-02-28");
    expect(addYears("2026-10-24", -2)).toBe("2024-10-24");
  });
});

describe("todayIn", () => {
  it("converts an instant to the local calendar day", () => {
    const now = new Date("2026-10-24T23:30:00Z");
    expect(todayIn("UTC", now)).toBe("2026-10-24");
    expect(todayIn("Asia/Tokyo", now)).toBe("2026-10-25"); // UTC+9
    expect(todayIn("America/Los_Angeles", now)).toBe("2026-10-24"); // UTC-7 in October
    expect(todayIn("Pacific/Auckland", now)).toBe("2026-10-25"); // UTC+13 (NZDT)
  });

  it("flips at local midnight, not UTC midnight", () => {
    // New York is UTC-4 in October (EDT).
    expect(todayIn("America/New_York", new Date("2026-10-25T03:59:59Z"))).toBe("2026-10-24");
    expect(todayIn("America/New_York", new Date("2026-10-25T04:00:00Z"))).toBe("2026-10-25");
  });

  it("handles the US spring-forward day (23 hour day)", () => {
    // 2026-03-08: 02:00 EST jumps to 03:00 EDT. Midnight is still 05:00Z.
    expect(todayIn("America/New_York", new Date("2026-03-08T04:59:59Z"))).toBe("2026-03-07");
    expect(todayIn("America/New_York", new Date("2026-03-08T05:00:00Z"))).toBe("2026-03-08");
    // After the jump the offset is -4, so the next midnight is 04:00Z.
    expect(todayIn("America/New_York", new Date("2026-03-09T03:59:59Z"))).toBe("2026-03-08");
    expect(todayIn("America/New_York", new Date("2026-03-09T04:00:00Z"))).toBe("2026-03-09");
  });

  it("handles the US fall-back day (25 hour day)", () => {
    // 2026-11-01: 02:00 EDT back to 01:00 EST. Midnight starts at 04:00Z, next at 05:00Z.
    expect(todayIn("America/New_York", new Date("2026-11-01T03:59:59Z"))).toBe("2026-10-31");
    expect(todayIn("America/New_York", new Date("2026-11-01T04:00:00Z"))).toBe("2026-11-01");
    expect(todayIn("America/New_York", new Date("2026-11-02T04:59:59Z"))).toBe("2026-11-01");
    expect(todayIn("America/New_York", new Date("2026-11-02T05:00:00Z"))).toBe("2026-11-02");
  });

  it("handles a European transition", () => {
    // Berlin leaves summer time on 2026-10-25: UTC+2 before 01:00Z, UTC+1 after.
    expect(todayIn("Europe/Berlin", new Date("2026-10-24T21:59:59Z"))).toBe("2026-10-24");
    expect(todayIn("Europe/Berlin", new Date("2026-10-24T22:00:00Z"))).toBe("2026-10-25");
    expect(todayIn("Europe/Berlin", new Date("2026-10-25T22:59:59Z"))).toBe("2026-10-25");
    expect(todayIn("Europe/Berlin", new Date("2026-10-25T23:00:00Z"))).toBe("2026-10-26");
  });

  it("handles the 30 minute shift on Lord Howe Island", () => {
    // Lord Howe: UTC+11 in summer, UTC+10:30 from 2026-04-05 02:00 local.
    // Before the change (Apr 4 12:59Z = Apr 4 23:59 local at +11).
    expect(todayIn("Australia/Lord_Howe", new Date("2026-04-04T12:59:59Z"))).toBe("2026-04-04");
    expect(todayIn("Australia/Lord_Howe", new Date("2026-04-04T13:00:00Z"))).toBe("2026-04-05");
    // After the change local midnight is 13:30Z.
    expect(todayIn("Australia/Lord_Howe", new Date("2026-04-05T13:29:59Z"))).toBe("2026-04-05");
    expect(todayIn("Australia/Lord_Howe", new Date("2026-04-05T13:30:00Z"))).toBe("2026-04-06");
  });

  it("reports the local hour", () => {
    expect(localHourIn("UTC", new Date("2026-10-24T08:15:00Z"))).toBe(8);
    expect(localHourIn("Asia/Kolkata", new Date("2026-10-24T08:15:00Z"))).toBe(13); // UTC+5:30
    expect(localHourIn("America/New_York", new Date("2026-10-24T04:00:00Z"))).toBe(0);
  });

  it("validates time zone names", () => {
    expect(isValidTimeZone("Europe/Berlin")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
