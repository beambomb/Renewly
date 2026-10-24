"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseSettingsForm, timezoneSchema, type FieldError } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/supabase/user";
import { strings } from "@/lib/strings";

export type SettingsState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; errors: FieldError[] };

export async function updateSettings(_previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const parsed = parseSettingsForm(formData);
  if (!parsed.success) return { status: "error", errors: parsed.errors };

  const userId = await getUserId();
  if (!userId) redirect("/sign-in");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      timezone: parsed.data.timezone,
      default_currency: parsed.data.defaultCurrency,
      reminder_offsets: parsed.data.reminderOffsets,
      email_enabled: parsed.data.emailEnabled,
    })
    .eq("user_id", userId);

  if (error) return { status: "error", errors: [{ field: "form", message: strings.form.saveFailed }] };

  revalidatePath("/settings");
  return { status: "saved" };
}

/**
 * Called once from the browser to replace the default "UTC" with the device's
 * time zone. Only touches a profile that is still on the default.
 */
export async function setDetectedTimezone(timezone: string): Promise<void> {
  const parsed = timezoneSchema.safeParse(timezone);
  if (!parsed.success) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ timezone: parsed.data }).eq("user_id", userId).eq("timezone", "UTC");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
