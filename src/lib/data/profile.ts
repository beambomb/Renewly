import { profileFromRow, type Profile } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/server";

const COLUMNS = "timezone, default_currency, reminder_offsets, email_enabled, push_enabled";

/**
 * The signed-in user's profile. The row is normally created by a database
 * trigger at sign-up; if it is missing (for example an account that predates
 * the migration) it is created with defaults. Returns null on any failure.
 */
export async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const existing = await supabase.from("profiles").select(COLUMNS).maybeSingle();
    if (existing.error) return null;
    if (existing.data) return profileFromRow(existing.data);

    const created = await supabase.from("profiles").insert({}).select(COLUMNS).single();
    if (created.error) return null;
    return profileFromRow(created.data);
  } catch {
    return null;
  }
}
