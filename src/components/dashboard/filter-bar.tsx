import Link from "next/link";
import { Search } from "lucide-react";
import { SectionIcon } from "@/components/sections/section-icon";
import { hrefFor } from "@/lib/dashboard/url";
import type { DashboardFilters } from "@/lib/dashboard/view";
import { ITEM_KINDS } from "@/lib/items/types";
import { strings } from "@/lib/strings";

const CHIP =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-[var(--duration-fast)]";

// Filters live in the URL (plain links + GET form), so they work without JavaScript.
export function FilterBar({
  filters,
  categories,
  counts,
  basePath = "/",
}: {
  filters: DashboardFilters;
  categories: string[];
  counts: Partial<Record<string, number>>;
  basePath?: string;
}) {
  const active = filters.section ?? null;
  const hasFilters = Boolean(filters.section || filters.category || filters.query);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label={strings.dashboard.filterNav}>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <li>
            <Link
              href={hrefFor({ ...filters, section: null }, basePath)}
              aria-current={active === null ? "page" : undefined}
              className={`${CHIP} ${active === null ? "border-primary bg-primary text-on-primary" : "border-muted-foreground text-foreground hover:bg-muted"}`}
            >
              {strings.dashboard.filterAll}
            </Link>
          </li>
          {ITEM_KINDS.map((kind) => {
            const isActive = active === kind;
            const count = counts[kind] ?? 0;
            return (
              <li key={kind}>
                <Link
                  href={hrefFor({ ...filters, section: kind }, basePath)}
                  aria-current={isActive ? "page" : undefined}
                  className={`${CHIP} ${isActive ? "border-primary bg-primary text-on-primary" : "border-muted-foreground text-foreground hover:bg-muted"}`}
                >
                  <SectionIcon kind={kind} size={18} />
                  {strings.item.kinds[kind].plural}
                  <span className={isActive ? "text-on-primary" : "text-muted-foreground"}>{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action={basePath} method="get" role="search" className="flex flex-wrap items-end gap-3">
        {filters.section ? <input type="hidden" name="section" value={filters.section} /> : null}
        <div className="flex basis-full flex-col gap-1 sm:basis-0 sm:flex-1">
          <label htmlFor="q" className="text-sm font-medium text-foreground">
            {strings.dashboard.searchLabel}
          </label>
          <div className="relative">
            <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.query ?? ""}
              placeholder={strings.dashboard.searchPlaceholder}
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-muted-foreground bg-card pl-10 pr-3 text-card-foreground"
            />
          </div>
        </div>
        {categories.length > 0 ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:w-56 sm:flex-none">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              {strings.dashboard.categoryLabel}
            </label>
            <select
              id="category"
              name="category"
              defaultValue={filters.category ?? ""}
              className="min-h-11 w-full rounded-md border border-muted-foreground bg-card px-3 text-card-foreground"
            >
              <option value="">{strings.dashboard.categoryAll}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-md bg-primary px-6 font-medium text-on-primary hover:opacity-90 active:opacity-80"
        >
          {strings.dashboard.apply}
        </button>
        {hasFilters ? (
          <Link href={basePath} className="inline-flex min-h-11 items-center justify-center px-2 text-muted-foreground underline">
            {strings.dashboard.clear}
          </Link>
        ) : null}
      </form>
    </div>
  );
}
