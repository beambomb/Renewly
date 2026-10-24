import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddPicker } from "@/components/items/add-picker";
import { PageHeader } from "@/components/shell/page-header";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.pages.addTitle };

/** Development-only copy of the Add page that needs no sign-in. */
export default function AddPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={strings.pages.addTitle} lead={strings.pages.addLead} />
      <AddPicker basePath="/dev/form" />
    </div>
  );
}
