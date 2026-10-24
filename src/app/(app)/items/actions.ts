"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUserContext } from "@/lib/data/context";
import { getItem, isValidItemId } from "@/lib/data/items";
import { advanceReminder } from "@/lib/items/advance";
import { inputToRow } from "@/lib/items/mapping";
import { isItemKind, type ItemInput, type ItemStatus } from "@/lib/items/types";
import { collectValues, parseItemForm, type FormValues } from "@/lib/schemas/item";
import type { FieldError } from "@/lib/schemas/profile";
import { parseSavingsEntryForm } from "@/lib/schemas/savings-entry";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";

export type ItemFormState =
  | { status: "idle" }
  | { status: "error"; errors: FieldError[]; values: FormValues };

export type EntryFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; errors: FieldError[] };

const GENERIC: FieldError[] = [{ field: "form", message: strings.item.errors.saveFailed }];

function failed(values: FormValues = {}, errors: FieldError[] = GENERIC): ItemFormState {
  return { status: "error", errors, values };
}

/** Creates an item of the given section. The section comes from the route, never trusted blindly. */
export async function createItem(kind: string, _previous: ItemFormState, formData: FormData): Promise<ItemFormState> {
  if (!isItemKind(kind)) return failed();
  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const parsed = parseItemForm(kind, formData, { today: context.today });
  if (!parsed.success) return { status: "error", errors: parsed.errors, values: parsed.values };

  const supabase = await createClient();
  const row = inputToRow(parsed.data, { today: context.today });
  const { data, error } = await supabase.from("items").insert(row).select("id").single();
  if (error || !data) return failed(collectValues(formData));

  // A starting balance becomes the goal's first deposit.
  if (parsed.data.kind === "savings" && parsed.data.startingMinor > 0) {
    const entry = await supabase.from("savings_entries").insert({
      item_id: data.id,
      entry_type: "deposit",
      amount_minor: parsed.data.startingMinor,
      occurred_on: context.today,
      note: strings.savingsEntry.startingNote,
    });
    if (entry.error) {
      await supabase.from("items").delete().eq("id", data.id);
      return failed(collectValues(formData));
    }
  }

  revalidatePath("/");
  redirect(`/items/${data.id}`);
}

/** Saves edits. The section and the saved total never change here. */
export async function updateItem(id: string, _previous: ItemFormState, formData: FormData): Promise<ItemFormState> {
  if (!isValidItemId(id)) return failed();
  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const existing = await getItem(id);
  if (!existing) return failed({}, [{ field: "form", message: strings.item.errors.notFound }]);

  const parsed = parseItemForm(existing.kind, formData, { today: context.today });
  if (!parsed.success) return { status: "error", errors: parsed.errors, values: parsed.values };

  // Entries are stored in the goal's currency, so it cannot change after creation.
  const input: ItemInput =
    parsed.data.kind === "savings" && existing.currency
      ? { ...parsed.data, currency: existing.currency }
      : parsed.data;

  const row = inputToRow(input, {
    today: context.today,
    previousPeriodStart: existing.periodStart,
    includeKind: false,
  });

  const supabase = await createClient();
  const { error } = await supabase.from("items").update(row).eq("id", id);
  if (error) return failed(collectValues(formData));

  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string): Promise<void> {
  if (!isValidItemId(id)) redirect("/");
  const context = await getUserContext();
  if (!context) redirect("/sign-in");
  const supabase = await createClient();
  await supabase.from("items").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}

const statusSchema = z.enum(["active", "paused", "cancelled"]);

/** Pause, resume or cancel. Only subscriptions can be cancelled. */
export async function setItemStatus(id: string, status: string): Promise<void> {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success || !isValidItemId(id)) redirect("/");
  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const item = await getItem(id);
  if (!item) redirect("/");
  if (parsed.data === "cancelled" && item.kind !== "subscription") redirect(`/items/${id}`);
  if (item.kind === "savings" && parsed.data === "cancelled") redirect(`/items/${id}`);

  const supabase = await createClient();
  await supabase.from("items").update({ status: parsed.data satisfies ItemStatus }).eq("id", id);
  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

/** Done for a one-off reminder; the next occurrence for a repeating one. */
export async function markReminderDone(id: string): Promise<void> {
  if (!isValidItemId(id)) redirect("/");
  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const item = await getItem(id);
  if (!item || item.kind !== "reminder" || !item.dueDate) redirect("/");

  const supabase = await createClient();
  if (item.billingCycle === null) {
    await supabase.from("items").update({ status: "done" }).eq("id", id);
  } else {
    const next = advanceReminder(
      {
        repeat: item.billingCycle,
        cycleDays: item.cycleDays,
        billingAnchorDay: item.billingAnchorDay,
        dueDate: item.dueDate,
      },
      context.today,
    );
    await supabase
      .from("items")
      .update({ period_start: next.periodStart, due_date: next.dueDate, status: "active" })
      .eq("id", id);
  }
  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

/** Puts a finished one-off reminder back on the list. */
export async function reopenReminder(id: string): Promise<void> {
  if (!isValidItemId(id)) redirect("/");
  const context = await getUserContext();
  if (!context) redirect("/sign-in");
  const supabase = await createClient();
  await supabase.from("items").update({ status: "active" }).eq("id", id).eq("kind", "reminder");
  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

/** Deposit, withdrawal or corrected total for a savings goal. */
export async function addSavingsEntry(
  itemId: string,
  _previous: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const fail = (errors: FieldError[]): EntryFormState => ({ status: "error", errors });
  const generic = [{ field: "form", message: strings.savingsEntry.errors.saveFailed }];
  if (!isValidItemId(itemId)) return fail(generic);

  const context = await getUserContext();
  if (!context) redirect("/sign-in");

  const item = await getItem(itemId);
  if (!item || item.kind !== "savings" || !item.currency || item.savedMinor === null) return fail(generic);

  const parsed = parseSavingsEntryForm(formData, {
    currency: item.currency,
    savedMinor: item.savedMinor,
    today: context.today,
  });
  if (!parsed.success) return fail(parsed.errors);

  const supabase = await createClient();
  const { error } = await supabase.from("savings_entries").insert({
    item_id: itemId,
    entry_type: parsed.data.entryType,
    amount_minor: parsed.data.amountMinor,
    occurred_on: parsed.data.occurredOn,
    note: parsed.data.note,
  });
  if (error) return fail(generic);

  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
  return { status: "saved" };
}

export async function deleteSavingsEntry(itemId: string, entryId: string): Promise<void> {
  if (!isValidItemId(itemId) || !isValidItemId(entryId)) redirect("/");
  const context = await getUserContext();
  if (!context) redirect("/sign-in");
  const supabase = await createClient();
  // The database refuses the delete if it would push the total below zero.
  await supabase.from("savings_entries").delete().eq("id", entryId).eq("item_id", itemId);
  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
  redirect(`/items/${itemId}`);
}
