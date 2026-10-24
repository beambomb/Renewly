import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { createFormValues } from "@/lib/items/form-values";
import { isItemKind } from "@/lib/items/types";
import { currencyOptions } from "@/lib/options";
import { strings } from "@/lib/strings";
import type { ItemFormState } from "../../../items/actions";
import { ItemForm } from "../../../items/_components/item-form";

export const metadata: Metadata = { title: strings.dev.formTitle };

/** Development-only: a create form that needs no sign-in and saves nothing. */
export default async function FormPreviewPage({ params }: { params: Promise<{ kind: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { kind } = await params;
  if (!isItemKind(kind)) notFound();

  async function submit(): Promise<ItemFormState> {
    "use server";
    return { status: "idle" };
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        eyebrow={strings.pages.addTitle}
        title={strings.item.kinds[kind].name}
        lead={strings.item.kinds[kind].description}
      />
      <ItemForm
        kind={kind}
        mode="create"
        action={submit}
        initial={createFormValues(kind, { today: "2026-10-24", currency: "IDR" })}
        currencies={currencyOptions()}
        cancelHref="/dev/add"
      />
    </div>
  );
}
