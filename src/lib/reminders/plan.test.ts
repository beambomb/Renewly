import { describe, expect, it } from "vitest";
import {
  DEFAULT_OFFSETS,
  effectiveOffsets,
  isSendTime,
  planReminders,
  reminderKey,
  type PlannableItem,
  type PlanOptions,
} from "./plan";

const item = (overrides: Partial<PlannableItem> = {}): PlannableItem => ({
  id: "item-1",
  status: "active",
  dueDate: "2026-10-31",
  reminderOffsets: null,
  ...overrides,
});

// 09:00 UTC on 2026-10-24 (morning in UTC, evening in Tokyo, night in LA)
const NOW = new Date("2026-10-24T09:00:00Z");

const options = (overrides: Partial<PlanOptions> = {}): PlanOptions => ({
  now: NOW,
  timeZone: "UTC",
  profileOffsets: DEFAULT_OFFSETS,
  channels: ["in_app", "email"],
  ...overrides,
});

describe("offsets", () => {
  it("fires 7, 3, 1 and 0 days before by default", () => {
    const dueFor = (daysAhead: number) => {
      const today = new Date("2026-10-24T09:00:00Z");
      const due = new Date(today.getTime() + daysAhead * 86_400_000).toISOString().slice(0, 10);
      return planReminders([item({ dueDate: due })], options()).map((r) => r.offsetDays);
    };
    expect(dueFor(7)).toEqual([7, 7]); // in_app + email
    expect(dueFor(3)).toEqual([3, 3]);
    expect(dueFor(1)).toEqual([1, 1]);
    expect(dueFor(0)).toEqual([0, 0]);
    expect(dueFor(5)).toEqual([]);
    expect(dueFor(2)).toEqual([]);
    expect(dueFor(30)).toEqual([]);
  });

  it("marks the due day as type due and earlier ones as upcoming", () => {
    const due = planReminders([item({ dueDate: "2026-10-24" })], options({ channels: ["in_app"] }));
    expect(due).toEqual([
      { itemId: "item-1", dueDate: "2026-10-24", offsetDays: 0, channel: "in_app", type: "due" },
    ]);
    const upcoming = planReminders([item({ dueDate: "2026-10-31" })], options({ channels: ["in_app"] }));
    expect(upcoming[0]?.type).toBe("upcoming");
  });

  it("uses per-item offsets instead of the profile default", () => {
    const custom = item({ dueDate: "2026-10-26", reminderOffsets: [2] });
    expect(planReminders([custom], options({ channels: ["in_app"] })).map((r) => r.offsetDays)).toEqual([2]);
    // The default 3-day offset would not have fired for a 2-day item anyway; 7 must not fire either.
    const sevenOut = item({ dueDate: "2026-10-31", reminderOffsets: [2] });
    expect(planReminders([sevenOut], options())).toEqual([]);
  });

  it("treats an empty per-item list as no reminders", () => {
    expect(planReminders([item({ dueDate: "2026-10-24", reminderOffsets: [] })], options())).toEqual([]);
  });

  it("normalises offsets: unique, whole, non-negative, nearest first", () => {
    expect(effectiveOffsets({ reminderOffsets: [3, 1, 3, -2, 1.5, 0] }, [7])).toEqual([0, 1, 3]);
    expect(effectiveOffsets({ reminderOffsets: null }, [7, 3])).toEqual([3, 7]);
  });
});

describe("time zones and the send window", () => {
  it("uses the user's local calendar day, not UTC", () => {
    // 2026-10-24T09:00Z is 18:00 on 10-24 in Tokyo, so an item due on 10-25 is one day away.
    const tokyo = planReminders([item({ dueDate: "2026-10-25" })], options({ timeZone: "Asia/Tokyo", channels: ["in_app"] }));
    expect(tokyo.map((r) => r.offsetDays)).toEqual([1]);
  });

  it("shifts the day for users ahead of UTC late in the evening", () => {
    // 23:30Z on 10-24 is already 08:30 on 10-25 in Tokyo, so an item due 10-25 is due today there.
    const now = new Date("2026-10-24T23:30:00Z");
    const result = planReminders([item({ dueDate: "2026-10-25" })], options({ now, timeZone: "Asia/Tokyo", channels: ["in_app"] }));
    expect(result.map((r) => r.offsetDays)).toEqual([0]);
  });

  it("sends nothing before the local send hour", () => {
    const early = new Date("2026-10-24T05:00:00Z"); // 05:00 UTC
    expect(isSendTime(early, "UTC")).toBe(false);
    expect(planReminders([item({ dueDate: "2026-10-24" })], options({ now: early }))).toEqual([]);
  });

  it("still sends later the same local day (late run catches up)", () => {
    const late = new Date("2026-10-24T15:00:00Z");
    expect(isSendTime(late, "UTC")).toBe(true);
    expect(planReminders([item({ dueDate: "2026-10-24" })], options({ now: late, channels: ["in_app"] }))).toHaveLength(1);
  });

  it("respects a custom send hour", () => {
    expect(isSendTime(NOW, "UTC", 10)).toBe(false);
    expect(isSendTime(NOW, "UTC", 9)).toBe(true);
  });

  it("follows the daylight-saving shift in the user's zone", () => {
    // US clocks fell back on 2026-11-01, so New York is on EST (UTC-5): 13:30Z is 08:30, 12:30Z is 07:30.
    const dayAfter = new Date("2026-11-02T13:30:00Z");
    const result = planReminders(
      [item({ dueDate: "2026-11-02" })],
      options({ now: dayAfter, timeZone: "America/New_York", channels: ["in_app"] }),
    );
    expect(result.map((r) => r.offsetDays)).toEqual([0]);
    const tooEarly = new Date("2026-11-02T12:30:00Z"); // 07:30 EST
    expect(planReminders([item({ dueDate: "2026-11-02" })], options({ now: tooEarly, timeZone: "America/New_York" }))).toEqual([]);
  });
});

describe("item status", () => {
  it("sends nothing for paused or cancelled items", () => {
    expect(planReminders([item({ status: "paused", dueDate: "2026-10-24" })], options())).toEqual([]);
    expect(planReminders([item({ status: "cancelled", dueDate: "2026-10-24" })], options())).toEqual([]);
  });
});

describe("overdue items", () => {
  it("sends one overdue notice per channel, not the missed offsets", () => {
    const result = planReminders([item({ dueDate: "2026-10-21" })], options());
    expect(result).toEqual([
      { itemId: "item-1", dueDate: "2026-10-21", offsetDays: -1, channel: "in_app", type: "overdue" },
      { itemId: "item-1", dueDate: "2026-10-21", offsetDays: -1, channel: "email", type: "overdue" },
    ]);
  });

  it("stops after the overdue window", () => {
    expect(planReminders([item({ dueDate: "2026-09-25" })], options())).toHaveLength(2); // 29 days
    expect(planReminders([item({ dueDate: "2026-09-24" })], options())).toHaveLength(2); // 30 days
    expect(planReminders([item({ dueDate: "2026-09-23" })], options())).toEqual([]); // 31 days
  });

  it("does not repeat once logged, even though it is still overdue the next day", () => {
    const logged = new Set([reminderKey("item-1", "2026-10-21", -1, "in_app"), reminderKey("item-1", "2026-10-21", -1, "email")]);
    expect(planReminders([item({ dueDate: "2026-10-21" })], options({ alreadyLogged: logged }))).toEqual([]);
  });

  it("is overdue per due date: a new due date can notify again", () => {
    const logged = new Set([reminderKey("item-1", "2026-10-21", -1, "in_app")]);
    const result = planReminders([item({ dueDate: "2026-10-22" })], options({ alreadyLogged: logged, channels: ["in_app"] }));
    expect(result).toHaveLength(1);
  });
});

describe("idempotency", () => {
  it("skips reminders already in the log, per channel", () => {
    const logged = new Set([reminderKey("item-1", "2026-10-27", 3, "email")]);
    const result = planReminders([item({ dueDate: "2026-10-27" })], options({ alreadyLogged: logged }));
    expect(result.map((r) => r.channel)).toEqual(["in_app"]);
  });

  it("gives the same plan when run twice with the same inputs", () => {
    const first = planReminders([item({ dueDate: "2026-10-27" })], options());
    const second = planReminders([item({ dueDate: "2026-10-27" })], options());
    expect(second).toEqual(first);
  });

  it("is not suppressed by a log entry for the old due date", () => {
    // The 7-day reminder was logged for the old due date; the user then moved the due date.
    const logged = new Set([reminderKey("item-1", "2026-11-07", 7, "in_app")]);
    const result = planReminders(
      [item({ dueDate: "2026-10-31" })],
      options({ alreadyLogged: logged, channels: ["in_app"] }),
    );
    expect(result.map((r) => r.offsetDays)).toEqual([7]);
  });

  it("builds a stable key", () => {
    expect(reminderKey("a", "2026-10-27", 3, "push")).toBe("a|2026-10-27|3|push");
  });
});

describe("several items", () => {
  it("plans each item independently", () => {
    const items = [
      item({ id: "a", dueDate: "2026-10-31" }),
      item({ id: "b", dueDate: "2026-10-27" }),
      item({ id: "c", dueDate: "2026-12-01" }),
      item({ id: "d", dueDate: "2026-10-24", status: "paused" }),
    ];
    const result = planReminders(items, options({ channels: ["in_app"] }));
    expect(result.map((r) => `${r.itemId}:${r.offsetDays}`)).toEqual(["a:7", "b:3"]);
  });
});
