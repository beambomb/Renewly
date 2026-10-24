import { describe, expect, it } from "vitest";
import type { Item } from "@/lib/items/types";
import { buildDashboard, filterItems, normalise } from "./view";

const TODAY = "2026-10-24";

let counter = 0;
function make(overrides: Partial<Item>): Item {
  counter += 1;
  return {
    id: `id-${counter}`,
    kind: "subscription",
    name: `Item ${counter}`,
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
    ...overrides,
  };
}

const sub = (name: string, dueDate: string, extra: Partial<Item> = {}) =>
  make({
    name,
    dueDate,
    periodStart: "2026-09-01",
    priceMinor: 1000,
    currency: "USD",
    billingCycle: "monthly",
    autoRenew: true,
    ...extra,
  });

const goal = (name: string, saved: number, target: number, deadline: string | null = null, extra: Partial<Item> = {}) =>
  make({
    kind: "savings",
    name,
    currency: "IDR",
    targetMinor: target,
    savedMinor: saved,
    dueDate: deadline,
    periodStart: deadline ? "2026-10-01" : null,
    ...extra,
  });

describe("grouping and ordering", () => {
  it("groups by section in the fixed order and omits empty sections", () => {
    const items = [
      make({ kind: "warranty", name: "Laptop", periodStart: "2025-01-01", dueDate: "2028-01-01" }),
      sub("Netflix", "2026-11-05"),
      goal("Trip", 100, 1000),
      make({ kind: "reminder", name: "Passport", periodStart: TODAY, dueDate: "2026-12-01" }),
    ];
    const view = buildDashboard(items, {}, TODAY);
    expect(view.groups.map((g) => g.kind)).toEqual(["subscription", "reminder", "savings", "warranty"]);
    expect(view.total).toBe(4);
    expect(view.shown).toBe(4);
  });

  it("orders time-based entries overdue first, then least time left, inactive last", () => {
    const items = [
      sub("Later", "2026-12-20"),
      sub("Soon", "2026-10-27"),
      sub("Overdue", "2026-10-20", { autoRenew: false }),
      sub("Paused", "2026-10-25", { status: "paused" }),
      sub("Today", "2026-10-24"),
    ];
    const names = buildDashboard(items, {}, TODAY).groups[0]?.entries.map((e) => e.item.name);
    expect(names).toEqual(["Overdue", "Today", "Soon", "Later", "Paused"]);
  });

  it("orders savings by nearest deadline, goals without one after, completed last", () => {
    const items = [
      goal("No deadline", 0, 1000),
      goal("Done", 1000, 1000, "2026-10-30"),
      goal("Far", 0, 1000, "2027-06-01"),
      goal("Near", 0, 1000, "2026-12-01"),
    ];
    const names = buildDashboard(items, {}, TODAY).groups[0]?.entries.map((e) => e.item.name);
    expect(names).toEqual(["Near", "Far", "No deadline", "Done"]);
  });

  it("skips malformed rows instead of crashing", () => {
    const view = buildDashboard([make({ periodStart: null, dueDate: null }), goal("Bad", 0, 0)], {}, TODAY);
    expect(view.groups).toEqual([]);
  });
});

describe("filters and search", () => {
  const items = [
    sub("Netflix", "2026-11-05", { category: "Entertainment" }),
    sub("Spotify", "2026-11-06", { category: "Music", notes: "Family plan" }),
    make({ kind: "recurring", name: "Café beans", category: "Groceries", periodStart: "2026-10-14", dueDate: "2026-10-28", usualStore: "Corner Roastery" }),
    goal("Dana darurat", 0, 1000),
  ];

  it("filters by section", () => {
    expect(filterItems(items, { section: "recurring" }).map((i) => i.name)).toEqual(["Café beans"]);
    expect(buildDashboard(items, { section: "savings" }, TODAY).groups.map((g) => g.kind)).toEqual(["savings"]);
  });

  it("filters by category ignoring case and accents", () => {
    expect(filterItems(items, { category: "music" }).map((i) => i.name)).toEqual(["Spotify"]);
    expect(filterItems(items, { category: "ENTERTAINMENT" }).map((i) => i.name)).toEqual(["Netflix"]);
  });

  it("searches names, notes and stores, forgiving accents and case", () => {
    expect(filterItems(items, { query: "cafe" }).map((i) => i.name)).toEqual(["Café beans"]);
    expect(filterItems(items, { query: "FAMILY" }).map((i) => i.name)).toEqual(["Spotify"]);
    expect(filterItems(items, { query: "roastery" }).map((i) => i.name)).toEqual(["Café beans"]);
  });

  it("requires every word to match, in any order", () => {
    expect(filterItems(items, { query: "plan family" }).map((i) => i.name)).toEqual(["Spotify"]);
    expect(filterItems(items, { query: "plan netflix" })).toEqual([]);
  });

  it("combines filters and reports counts", () => {
    const view = buildDashboard(items, { section: "subscription", query: "spot" }, TODAY);
    expect(view.shown).toBe(1);
    expect(view.total).toBe(4);
  });

  it("normalises text", () => {
    expect(normalise("  Café  ")).toBe("cafe");
  });
});

describe("upcoming in 30 days", () => {
  it("lists active items due within 30 days, soonest first, including today", () => {
    const items = [
      sub("Day 30", "2026-11-23"),
      sub("Day 31", "2026-11-24"),
      sub("Today", "2026-10-24"),
      sub("Tomorrow", "2026-10-25"),
      sub("Overdue", "2026-10-20", { autoRenew: false }),
      sub("Paused", "2026-10-26", { status: "paused" }),
    ];
    expect(buildDashboard(items, {}, TODAY).upcoming.map((u) => u.item.name)).toEqual(["Today", "Tomorrow", "Day 30"]);
  });

  it("includes savings deadlines but not completed goals", () => {
    const items = [goal("Trip", 100, 1000, "2026-11-10"), goal("Done", 1000, 1000, "2026-11-10"), goal("Open ended", 0, 1000)];
    expect(buildDashboard(items, {}, TODAY).upcoming.map((u) => u.item.name)).toEqual(["Trip"]);
  });

  it("includes reminders and warranties ending soon", () => {
    const items = [
      make({ kind: "reminder", name: "Passport", periodStart: TODAY, dueDate: "2026-11-02" }),
      make({ kind: "warranty", name: "Phone", periodStart: "2024-11-10", dueDate: "2026-11-10" }),
    ];
    expect(buildDashboard(items, {}, TODAY).upcoming.map((u) => [u.item.name, u.daysLeft])).toEqual([
      ["Passport", 9],
      ["Phone", 17],
    ]);
  });
});

describe("section monthly cost and categories", () => {
  const items = [
    sub("A", "2026-11-05", { priceMinor: 1000, category: "Cloud" }),
    sub("B", "2026-11-05", { priceMinor: 12000, billingCycle: "yearly", category: "Cloud" }),
    sub("C", "2026-11-05", { priceMinor: 500, currency: "EUR", category: "Music" }),
    sub("Paused", "2026-11-05", { priceMinor: 9999, status: "paused" }),
  ];

  it("totals the listed active subscriptions per currency", () => {
    const group = buildDashboard(items, {}, TODAY).groups[0];
    expect(group?.cost).toEqual({
      totals: [
        { currency: "EUR", monthlyMinor: 500 },
        { currency: "USD", monthlyMinor: 2000 },
      ],
      estimated: false,
    });
  });

  it("follows the displayed list when filters apply", () => {
    const cloud = buildDashboard(items, { category: "cloud" }, TODAY).groups[0];
    expect(cloud?.cost?.totals).toEqual([{ currency: "USD", monthlyMinor: 2000 }]);
    const music = buildDashboard(items, { category: "music" }, TODAY).groups[0];
    expect(music?.cost?.totals).toEqual([{ currency: "EUR", monthlyMinor: 500 }]);
  });

  it("has no groups, and so no figure, when nothing matches", () => {
    const view = buildDashboard(items, { query: "zzz" }, TODAY);
    expect(view.groups).toEqual([]);
    expect("monthlyTotals" in view).toBe(false);
  });

  it("gives reminder, savings and warranty groups no cost and flags recurring as an estimate", () => {
    const view = buildDashboard(
      [
        make({ kind: "reminder", name: "Passport", periodStart: TODAY, dueDate: "2026-12-01", priceMinor: 100, currency: "USD", billingCycle: "monthly" }),
        goal("Trip", 100, 1000),
        make({ kind: "warranty", name: "Laptop", periodStart: "2025-01-01", dueDate: "2028-01-01", priceMinor: 100, currency: "USD" }),
        make({ kind: "recurring", name: "Beans", periodStart: "2026-10-14", dueDate: "2026-10-28", usualPriceMinor: 120000, usualCurrency: "IDR", durationDays: 14 }),
      ],
      {},
      TODAY,
    );
    const costOf = (kind: string) => view.groups.find((g) => g.kind === kind)?.cost;
    expect(costOf("reminder")).toBeNull();
    expect(costOf("savings")).toBeNull();
    expect(costOf("warranty")).toBeNull();
    expect(costOf("recurring")).toEqual({ totals: [{ currency: "IDR", monthlyMinor: 260893 }], estimated: true });
  });

  it("lists distinct categories sorted", () => {
    const items = [sub("A", "2026-11-05", { category: "Music" }), sub("B", "2026-11-05", { category: "Cloud" }), sub("C", "2026-11-05", { category: "Music" }), sub("D", "2026-11-05")];
    expect(buildDashboard(items, {}, TODAY).categories).toEqual(["Cloud", "Music"]);
  });
});

describe("scale", () => {
  it("handles 200 items quickly", () => {
    const items = Array.from({ length: 200 }, (_, i) => sub(`Item ${i}`, `2026-${i % 2 ? "11" : "12"}-${String((i % 27) + 1).padStart(2, "0")}`));
    const started = performance.now();
    const view = buildDashboard(items, { query: "item" }, TODAY);
    const elapsed = performance.now() - started;
    expect(view.shown).toBe(200);
    expect(elapsed).toBeLessThan(200);
  });
});
