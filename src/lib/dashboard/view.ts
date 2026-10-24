import type { CalendarDate } from "@/lib/dates/calendar";
import { ITEM_KINDS, type Item, type ItemKind } from "@/lib/items/types";
import { sectionMonthlyCost, type SectionCost } from "@/lib/money/section-cost";
import { computeRing, urgencyRank, type RingViewModel } from "@/lib/rings/ring";
import { computeSavings, type SavingsProgress } from "@/lib/savings/savings";

export interface DashboardFilters {
  section?: ItemKind | null | undefined;
  category?: string | null | undefined;
  query?: string | null | undefined;
}

export type DashboardEntry =
  | { type: "time"; item: Item; ring: RingViewModel }
  | { type: "savings"; item: Item; progress: SavingsProgress };

export interface SectionGroup {
  kind: ItemKind;
  entries: DashboardEntry[];
  /** Monthly cost of the entries listed here (after filters); null when the section has none. */
  cost: SectionCost | null;
}

export interface UpcomingEntry {
  item: Item;
  dueDate: CalendarDate;
  daysLeft: number;
}

export interface DashboardView {
  groups: SectionGroup[];
  /** Active items due within the window, soonest first. */
  upcoming: UpcomingEntry[];
  /** Distinct categories across all items, sorted. */
  categories: string[];
  total: number;
  shown: number;
}

export const UPCOMING_DAYS = 30;

/** Lowercase, accent-free text for forgiving search. */
export function normalise(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function matchesQuery(item: Item, query: string): boolean {
  const haystack = normalise(
    [item.name, item.category, item.notes, item.usualStore, item.serialNumber, item.paymentMethod]
      .filter(Boolean)
      .join(" "),
  );
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterItems(items: readonly Item[], filters: DashboardFilters): Item[] {
  const query = filters.query ? normalise(filters.query) : "";
  const category = filters.category ? normalise(filters.category) : "";
  return items.filter((item) => {
    if (filters.section && item.kind !== filters.section) return false;
    if (category && normalise(item.category ?? "") !== category) return false;
    if (query && !matchesQuery(item, query)) return false;
    return true;
  });
}

function toEntry(item: Item, today: CalendarDate): DashboardEntry | null {
  if (item.kind === "savings") {
    if (item.targetMinor === null || item.targetMinor <= 0 || item.savedMinor === null) return null;
    return {
      type: "savings",
      item,
      progress: computeSavings({ targetMinor: item.targetMinor, savedMinor: item.savedMinor, deadline: item.dueDate }, today),
    };
  }
  if (!item.periodStart || !item.dueDate) return null;
  const ring = computeRing(
    { kind: item.kind, status: item.status, name: item.name, periodStart: item.periodStart, dueDate: item.dueDate },
    today,
  );
  return { type: "time", item, ring };
}

function compareEntries(a: DashboardEntry, b: DashboardEntry): number {
  if (a.type === "time" && b.type === "time") {
    return urgencyRank(a.ring) - urgencyRank(b.ring) || a.item.name.localeCompare(b.item.name);
  }
  if (a.type === "savings" && b.type === "savings") {
    const rank = (e: Extract<DashboardEntry, { type: "savings" }>) => (e.progress.completed ? 1 : 0);
    const days = (e: Extract<DashboardEntry, { type: "savings" }>) => e.progress.daysToDeadline ?? Number.MAX_SAFE_INTEGER;
    return rank(a) - rank(b) || days(a) - days(b) || a.item.name.localeCompare(b.item.name);
  }
  return 0;
}

/** Groups, sorts and summarises items for the home screen. Pure: `today` is the user's local date. */
export function buildDashboard(
  items: readonly Item[],
  filters: DashboardFilters,
  today: CalendarDate,
): DashboardView {
  const filtered = filterItems(items, filters);

  const groups: SectionGroup[] = [];
  const upcoming: UpcomingEntry[] = [];

  for (const kind of ITEM_KINDS) {
    const entries: DashboardEntry[] = [];
    for (const item of filtered) {
      if (item.kind !== kind) continue;
      const entry = toEntry(item, today);
      if (!entry) continue;
      entries.push(entry);

      if (item.status === "active" && item.dueDate) {
        const daysLeft = entry.type === "time" ? entry.ring.daysLeft : (entry.progress.daysToDeadline ?? -1);
        const isOpenGoal = entry.type === "savings" ? !entry.progress.completed : true;
        if (daysLeft >= 0 && daysLeft <= UPCOMING_DAYS && isOpenGoal) {
          upcoming.push({ item, dueDate: item.dueDate, daysLeft });
        }
      }
    }
    entries.sort(compareEntries);
    if (entries.length > 0) groups.push({ kind, entries, cost: sectionMonthlyCost(kind, entries.map((e) => e.item)) });
  }

  upcoming.sort((a, b) => a.daysLeft - b.daysLeft || a.item.name.localeCompare(b.item.name));

  const categories = [...new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))].sort((a, b) =>
    a.localeCompare(b),
  );

  return {
    groups,
    upcoming,
    categories,
    total: items.length,
    shown: groups.reduce((sum, g) => sum + g.entries.length, 0),
  };
}
