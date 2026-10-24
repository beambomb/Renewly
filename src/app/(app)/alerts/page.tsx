import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.pages.alertsTitle };

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={strings.pages.alertsTitle} />
      <p className="text-muted-foreground">{strings.pages.alertsEmpty}</p>
    </div>
  );
}
