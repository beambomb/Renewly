import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardBody, sectionCountsOf } from "@/components/dashboard/dashboard-body";
import { PageHeader } from "@/components/shell/page-header";
import { sampleItems } from "@/lib/dashboard/sample";
import { filtersFromParams } from "@/lib/dashboard/url";
import { buildDashboard } from "@/lib/dashboard/view";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.dev.previewTitle };

// Fixed date so the preview always looks the same.
const TODAY = "2026-10-24";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Development-only: the real dashboard rendered with demo data from all five sections. */
export default async function DashboardPreviewPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV === "production") notFound();

  const filters = filtersFromParams(await searchParams);
  const items = sampleItems(TODAY);
  const view = buildDashboard(items, filters, TODAY);
  const sectionCounts = sectionCountsOf(buildDashboard(items, { ...filters, section: null }, TODAY));

  async function noop() {
    "use server";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={strings.dev.previewTitle} lead={strings.dev.previewLead} />
      <DashboardBody
        view={view}
        filters={filters}
        sectionCounts={sectionCounts}
        markDone={() => noop}
        basePath="/dev/preview"
      />
    </div>
  );
}
