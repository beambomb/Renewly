import Link from "next/link";
import { ReminderRow, RingEntry, SavingsEntry } from "@/components/dashboard/entries";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { MonthlyCost, Upcoming } from "@/components/dashboard/summary";
import { SectionIcon } from "@/components/sections/section-icon";
import type { DashboardFilters, DashboardView } from "@/lib/dashboard/view";
import { ITEM_KINDS } from "@/lib/items/types";
import { strings } from "@/lib/strings";

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

interface Props {
  view: DashboardView;
  filters: DashboardFilters;
  /** How many entries each section chip would show (ignores the section filter). */
  sectionCounts: Record<string, number>;
  /** Server action factory for the one-tap Done on a reminder row. */
  markDone: (itemId: string) => () => Promise<void>;
  /** The page the filters belong to. */
  basePath?: string;
}

/** Summary panels, filters and one block per section, each in its own style. */
export function DashboardBody({ view, filters, sectionCounts, markDone, basePath = "/" }: Props) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <MonthlyCost totals={view.monthlyTotals} />
        <Upcoming entries={view.upcoming} />
      </div>

      <FilterBar filters={filters} categories={view.categories} counts={sectionCounts} basePath={basePath} />

      {view.shown === 0 ? (
        <div role="status" className="rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
          <h2 className="text-xl font-semibold">{strings.dashboard.noResultsTitle}</h2>
          <p className="mt-1 text-muted-foreground">{strings.dashboard.noResultsBody}</p>
          <Link href={basePath} className="mt-3 inline-flex min-h-11 items-center underline">
            {strings.dashboard.clear}
          </Link>
        </div>
      ) : (
        ITEM_KINDS.map((kind) => {
          const group = view.groups.find((g) => g.kind === kind);
          if (!group) return null;
          return (
            <section key={kind} aria-labelledby={`${kind}-heading`} className="flex flex-col gap-3">
              <h2 id={`${kind}-heading`} className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <span className="text-secondary">
                  <SectionIcon kind={kind} size={22} />
                </span>
                {strings.item.kinds[kind].plural}
                <span className="text-base font-normal text-muted-foreground">
                  {strings.dashboard.sectionCount(group.entries.length)}
                </span>
              </h2>

              {kind === "reminder" ? (
                <ul className="flex flex-col gap-2">
                  {group.entries.map((entry) =>
                    entry.type === "time" ? (
                      <li key={entry.item.id}>
                        <ReminderRow entry={entry} markDone={markDone(entry.item.id)} />
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : kind === "savings" ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.entries.map((entry) =>
                    entry.type === "savings" ? (
                      <li key={entry.item.id}>
                        <SavingsEntry entry={entry} />
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : (
                <ul className={GRID}>
                  {group.entries.map((entry) =>
                    entry.type === "time" ? (
                      <li key={entry.item.id}>
                        <RingEntry entry={entry} />
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </section>
          );
        })
      )}
    </>
  );
}

export function sectionCountsOf(view: DashboardView): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const group of view.groups) counts[group.kind] = group.entries.length;
  return counts;
}
