import type { Metadata } from "next";
import { AddPicker } from "@/components/items/add-picker";
import { PageHeader } from "@/components/shell/page-header";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.pages.addTitle };

export default function AddPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={strings.pages.addTitle} lead={strings.pages.addLead} />
      <AddPicker />
    </div>
  );
}
