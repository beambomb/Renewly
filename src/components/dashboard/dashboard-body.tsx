import Link from "next/link";
import { ReminderRow, RingEntry, SavingsEntry } from "@/components/dashboard/entries";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Upcoming } from "@/components/dashboard/summary";
import type { DashboardFilters, DashboardView } from "@/lib/dashboard/view";
import { ITEM_KINDS } from "@/lib/items/types";
import { strings } from "@/lib/strings";

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

interface Props {
  view: DashboardView;
  filters: DashboardFilters;
  sectionCounts: Record<string, number>;
  markDone: (itemId: string) => () => Promise<void>;
  basePath?: string;
}

export function DashboardBody({ view, filters, sectionCounts, markDone, basePath = "/" }: Props) {
  return (
    <>
      <Upcoming entries={view.upcoming} />

      <FilterBar filters={filters} categories={view.categories} counts={sectionCounts} basePath={basePath} />

      {view.shown === 0 ? (
        <div role="status" className="rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
          <h2 className="text-xl font-semibold">{strings.dashboard.noResultsTitle}</h2>
          <Link href={basePath} className="mt-3 inline-flex min-h-11 items-center underline">
            {strings.dashboard.clear}
          </Link>
        </div>
      ) : (
        ITEM_KINDS.map((kind) => {
          const group = view.groups.find((g) => g.kind === kind);
          if (!group) return null;
          return (
            <section key={kind} aria-labelledby={`${kind}-heading`} className="flex flex-col gap-4 border-t border-border pt-6">
              <SectionHeader kind={kind} count={group.entries.length} cost={group.cost} />

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
