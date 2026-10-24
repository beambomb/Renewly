import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { DashboardBody, sectionCountsOf } from "@/components/dashboard/dashboard-body";
import { PRIMARY_BUTTON } from "@/components/form/fields";
import { PageHeader } from "@/components/shell/page-header";
import { getUserContext } from "@/lib/data/context";
import { listItems } from "@/lib/data/items";
import { filtersFromParams } from "@/lib/dashboard/url";
import { buildDashboard } from "@/lib/dashboard/view";
import { strings } from "@/lib/strings";
import { markReminderDone } from "./items/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const filters = filtersFromParams(await searchParams);
  const items = await listItems();
  const view = buildDashboard(items, filters, context.today);
  // Chip counts ignore the section filter so each chip shows what it would reveal.
  const sectionCounts = sectionCountsOf(buildDashboard(items, { ...filters, section: null }, context.today));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={strings.dashboard.title} />

      {view.total === 0 ? (
        <EmptyState />
      ) : (
        <DashboardBody
          view={view}
          filters={filters}
          sectionCounts={sectionCounts}
          markDone={(itemId) => markReminderDone.bind(null, itemId, "/")}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-lg border border-border bg-card p-8 text-center text-card-foreground">
      <h2 className="text-xl font-semibold">{strings.dashboard.emptyTitle}</h2>
      <Link href="/add" className={`${PRIMARY_BUTTON} mt-4`}>
        <Plus aria-hidden="true" size={18} />
        {strings.dashboard.emptyCta}
      </Link>
    </section>
  );
}
