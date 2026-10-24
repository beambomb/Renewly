import { z } from "zod";
import { ITEM_COLUMNS, rowToItem } from "@/lib/items/mapping";
import type { Item } from "@/lib/items/types";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

export function isValidItemId(id: unknown): id is string {
  return idSchema.safeParse(id).success;
}

/** All of the signed-in user's items (RLS limits the rows), soonest due first, undated last. */
export async function listItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error || !data) return [];
  return data.map(rowToItem);
}

export async function getItem(id: string): Promise<Item | null> {
  if (!isValidItemId(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select(ITEM_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToItem(data);
}

export interface SavingsEntry {
  id: string;
  entryType: "deposit" | "withdrawal" | "adjustment";
  amountMinor: number;
  occurredOn: string;
  note: string | null;
}

const entryRowSchema = z.object({
  id: z.string(),
  entry_type: z.enum(["deposit", "withdrawal", "adjustment"]),
  amount_minor: z.union([z.number(), z.string()]).transform(Number),
  occurred_on: z.string(),
  note: z.string().nullable(),
});

/** Newest first. */
export async function listSavingsEntries(itemId: string, limit = 100): Promise<SavingsEntry[]> {
  if (!isValidItemId(itemId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_entries")
    .select("id, entry_type, amount_minor, occurred_on, note")
    .eq("item_id", itemId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => {
    const r = entryRowSchema.parse(row);
    return { id: r.id, entryType: r.entry_type, amountMinor: r.amount_minor, occurredOn: r.occurred_on, note: r.note };
  });
}
