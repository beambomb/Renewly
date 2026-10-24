import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItem } from "@/lib/data/items";
import { itemToFormValues } from "@/lib/items/form-values";
import { currencyOptions } from "@/lib/options";
import { strings } from "@/lib/strings";
import { updateItem } from "../../actions";
import { ItemForm } from "../../_components/item-form";

export const metadata: Metadata = { title: strings.item.actions.edit };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-[2rem] font-bold leading-tight text-foreground">
        {strings.item.actions.edit}: {item.name}
      </h1>
      <ItemForm
        kind={item.kind}
        mode="edit"
        action={updateItem.bind(null, item.id)}
        initial={itemToFormValues(item)}
        currencies={currencyOptions()}
        cancelHref={`/items/${item.id}`}
      />
    </div>
  );
}
