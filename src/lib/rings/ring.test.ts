import { describe, expect, it } from "vitest";
import { computeRing, urgencyRank, type RingInput } from "./ring";

const base: RingInput = {
  kind: "subscription",
  status: "active",
  name: "Netflix",
  periodStart: "2026-10-01",
  dueDate: "2026-10-31", // 30 day period
};

const ringOn = (today: string, overrides: Partial<RingInput> = {}) =>
  computeRing({ ...base, ...overrides }, today);

describe("ring states", () => {
  it("is comfortable with more than 30% left", () => {
    const vm = ringOn("2026-10-10"); // 21 of 30 days left = 70%
    expect(vm.state).toBe("comfortable");
    expect(vm.daysLeft).toBe(21);
    expect(vm.percentLeft).toBe(70);
    expect(vm.label).toBe("21 days left");
  });

  it("is soon at exactly 30% left", () => {
    const vm = ringOn("2026-10-22"); // 9 of 30 days = 30%
    expect(vm.fractionLeft).toBeCloseTo(0.3, 10);
    expect(vm.state).toBe("soon");
  });

  it("is still comfortable just above 30%", () => {
    const vm = ringOn("2026-10-21"); // 10 of 30 = 33%
    expect(vm.state).toBe("comfortable");
  });

  it("is urgent at 3 days or less, overriding soon", () => {
    expect(ringOn("2026-10-28").state).toBe("urgent"); // 3 days
    expect(ringOn("2026-10-30").state).toBe("urgent"); // 1 day
    expect(ringOn("2026-10-27").state).toBe("soon"); // 4 days, 13%
  });

  it("is urgent on the due day with a clear label", () => {
    const vm = ringOn("2026-10-31");
    expect(vm.state).toBe("urgent");
    expect(vm.daysLeft).toBe(0);
    expect(vm.label).toBe("Due today");
    expect(vm.fractionLeft).toBe(0);
  });

  it("is overdue after the due date, overriding everything", () => {
    const vm = ringOn("2026-11-03");
    expect(vm.state).toBe("overdue");
    expect(vm.daysLeft).toBe(-3);
    expect(vm.label).toBe("Overdue by 3 days");
    expect(vm.fractionLeft).toBe(0);
    expect(ringOn("2026-11-01").label).toBe("Overdue by 1 day");
  });

  it("uses singular wording for one day left", () => {
    expect(ringOn("2026-10-30").label).toBe("1 day left");
  });
});

describe("ring fraction", () => {
  it("is full at the start of the period and shrinks", () => {
    expect(ringOn("2026-10-01").fractionLeft).toBe(1);
    expect(ringOn("2026-10-16").fractionLeft).toBe(0.5);
  });

  it("clamps when today is before the period starts", () => {
    const vm = ringOn("2026-09-20");
    expect(vm.fractionLeft).toBe(1);
    expect(vm.percentLeft).toBe(100);
    expect(vm.daysLeft).toBe(41);
  });

  it("never divides by zero for a zero-length period", () => {
    const vm = ringOn("2026-10-01", { periodStart: "2026-10-01", dueDate: "2026-10-01" });
    expect(vm.totalDays).toBe(1);
    expect(vm.state).toBe("urgent");
    expect(Number.isFinite(vm.fractionLeft)).toBe(true);
  });

  it("treats a one-day cycle sensibly", () => {
    const vm = ringOn("2026-10-02", { periodStart: "2026-10-01", dueDate: "2026-10-03" });
    expect(vm.state).toBe("urgent");
    expect(vm.label).toBe("1 day left");
  });
});

describe("inactive items", () => {
  it("shows paused items without urgency, even when overdue", () => {
    const vm = ringOn("2026-11-20", { status: "paused" });
    expect(vm.state).toBe("inactive");
    expect(vm.label).toBe("Paused");
  });

  it("shows cancelled items without urgency", () => {
    const vm = ringOn("2026-10-30", { status: "cancelled" });
    expect(vm.state).toBe("inactive");
    expect(vm.label).toBe("Cancelled");
  });

  it("sorts inactive items last", () => {
    const active = ringOn("2026-10-10");
    const paused = ringOn("2026-10-10", { status: "paused" });
    expect(urgencyRank(paused)).toBeGreaterThan(urgencyRank(active));
  });
});

describe("warranty wording", () => {
  const warranty: Partial<RingInput> = {
    kind: "warranty",
    name: "Laptop",
    periodStart: "2024-10-01",
    dueDate: "2026-10-01",
  };

  it("says expires today and expired ago instead of due and overdue", () => {
    expect(ringOn("2026-10-01", warranty).label).toBe("Expires today");
    expect(ringOn("2026-10-04", warranty).label).toBe("Expired 3 days ago");
    expect(ringOn("2026-10-02", warranty).label).toBe("Expired 1 day ago");
    expect(ringOn("2026-10-04", warranty).state).toBe("overdue");
  });

  it("counts days left for a long warranty", () => {
    const vm = ringOn("2026-09-01", warranty);
    expect(vm.label).toBe("30 days left");
    expect(vm.state).toBe("soon"); // 30 of 730 days
  });
});

describe("accessible label", () => {
  it("includes name, time left, percent and state in words", () => {
    const vm = ringOn("2026-10-22");
    expect(vm.ariaLabel).toBe("Netflix, 9 days left, 30 percent of the period left, status: Coming up");
  });

  it("never relies on colour: every active state has a text state label", () => {
    const states = ["2026-10-10", "2026-10-22", "2026-10-29", "2026-11-05"].map((d) => ringOn(d));
    expect(states.map((s) => s.stateLabel)).toEqual(["On track", "Coming up", "Urgent", "Overdue"]);
  });

  it("describes inactive items by name and status only", () => {
    expect(ringOn("2026-10-10", { status: "paused" }).ariaLabel).toBe("Netflix, Paused");
  });
});
