import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
    <div className="max-w-xl">
      <h1 className="mb-6 text-[2rem] font-bold leading-tight text-foreground">
        {strings.item.kinds[kind].name}
      </h1>
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
