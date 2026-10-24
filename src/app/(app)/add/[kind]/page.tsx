import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { getUserContext } from "@/lib/data/context";
import { createFormValues } from "@/lib/items/form-values";
import { isItemKind } from "@/lib/items/types";
import { currencyOptions } from "@/lib/options";
import { strings } from "@/lib/strings";
import { createItem } from "../../items/actions";
import { ItemForm } from "../../items/_components/item-form";

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  return { title: isItemKind(kind) ? strings.item.kinds[kind].name : strings.pages.addTitle };
}

export default async function AddKindPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isItemKind(kind)) notFound();

  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const initial = createFormValues(kind, {
    today: context.today,
    currency: context.profile?.defaultCurrency ?? "USD",
  });

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
        action={createItem.bind(null, kind)}
        initial={initial}
        currencies={currencyOptions()}
        cancelHref="/add"
      />
    </div>
  );
}
