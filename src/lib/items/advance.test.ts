import { describe, expect, it } from "vitest";
import { advanceReminder } from "./advance";

const monthly = (dueDate: string, anchorDay: number | null = null) => ({
  repeat: "monthly" as const,
  cycleDays: null,
  billingAnchorDay: anchorDay,
  dueDate,
});

describe("advanceReminder", () => {
  it("moves a monthly reminder one month ahead when marked done on its day", () => {
    expect(advanceReminder(monthly("2026-10-24"), "2026-10-24")).toEqual({
      periodStart: "2026-10-24",
      dueDate: "2026-11-24",
    });
  });

  it("moves one occurrence ahead when marked done early", () => {
    expect(advanceReminder(monthly("2026-11-05"), "2026-10-24")).toEqual({
      periodStart: "2026-11-05",
      dueDate: "2026-12-05",
    });
  });

  it("skips missed occurrences and lands on the next future one", () => {
    // Rent was due on the 5th each month; nothing was marked since July.
    expect(advanceReminder(monthly("2026-07-05"), "2026-10-24")).toEqual({
      periodStart: "2026-10-05",
      dueDate: "2026-11-05",
    });
  });

  it("does not return today when today is an occurrence date", () => {
    expect(advanceReminder(monthly("2026-09-24"), "2026-10-24").dueDate).toBe("2026-11-24");
  });

  it("keeps the 31st anchor through short months", () => {
    // Stored as 28 Feb with anchor day 31 -> next is 31 Mar, then 30 Apr.
    const first = advanceReminder(monthly("2026-02-28", 31), "2026-02-28");
    expect(first.dueDate).toBe("2026-03-31");
    expect(advanceReminder(monthly(first.dueDate, 31), first.dueDate).dueDate).toBe("2026-04-30");
  });

  it("handles weekly and custom day repeats", () => {
    expect(
      advanceReminder({ repeat: "weekly", cycleDays: null, billingAnchorDay: null, dueDate: "2026-10-20" }, "2026-10-24"),
    ).toEqual({ periodStart: "2026-10-20", dueDate: "2026-10-27" });
    expect(
      advanceReminder({ repeat: "custom", cycleDays: 10, billingAnchorDay: null, dueDate: "2026-10-01" }, "2026-10-24"),
    ).toEqual({ periodStart: "2026-10-21", dueDate: "2026-10-31" });
  });

  it("handles a yearly reminder on 29 Feb", () => {
    const next = advanceReminder(
      { repeat: "yearly", cycleDays: null, billingAnchorDay: 29, dueDate: "2028-02-29" },
      "2028-02-29",
    );
    expect(next.dueDate).toBe("2029-02-28");
  });
});
