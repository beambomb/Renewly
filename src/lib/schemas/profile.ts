import { z } from "zod";
import { isValidTimeZone } from "@/lib/dates/calendar";
import { strings } from "@/lib/strings";

/** Reminder day choices offered in the UI (days before the due date). */
export const OFFSET_CHOICES = [30, 14, 7, 3, 2, 1, 0] as const;
export const DEFAULT_REMINDER_OFFSETS = [7, 3, 1, 0] as const;

const knownCurrencies = new Set(Intl.supportedValuesOf("currency"));

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, strings.settings.timezoneInvalid)
  .max(64, strings.settings.timezoneInvalid)
  .refine(isValidTimeZone, strings.settings.timezoneInvalid);

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => /^[A-Z]{3}$/.test(code) && knownCurrencies.has(code), strings.settings.currencyInvalid);

/** Unique, whole, 0 to 365, at most 10, nearest-last (largest first). */
export const reminderOffsetsSchema = z
  .array(z.coerce.number().int().min(0).max(365))
  .max(10, strings.settings.offsetsInvalid)
  .transform((values) => [...new Set(values)].sort((a, b) => b - a));

export const profileSettingsSchema = z.object({
  timezone: timezoneSchema,
  defaultCurrency: currencySchema,
  reminderOffsets: reminderOffsetsSchema,
  emailEnabled: z.boolean(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;

export interface FieldError {
  field: string;
  message: string;
}

export type ParsedSettings =
  | { success: true; data: ProfileSettingsInput }
  | { success: false; errors: FieldError[] };

const FIELD_IDS: Record<string, string> = {
  timezone: "timezone",
  defaultCurrency: "defaultCurrency",
  reminderOffsets: "offsets",
};

/** Parses the settings form (checkbox groups arrive as repeated keys). */
export function parseSettingsForm(formData: FormData): ParsedSettings {
  const result = profileSettingsSchema.safeParse({
    timezone: String(formData.get("timezone") ?? ""),
    defaultCurrency: String(formData.get("defaultCurrency") ?? ""),
    reminderOffsets: formData.getAll("offsets").map((value) => String(value)),
    emailEnabled: formData.get("emailEnabled") === "on",
  });
  if (result.success) return { success: true, data: result.data };

  const seen = new Set<string>();
  const errors: FieldError[] = [];
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (seen.has(key)) continue;
    seen.add(key);
    errors.push({
      field: FIELD_IDS[key] ?? key,
      message: key === "reminderOffsets" ? strings.settings.offsetsInvalid : issue.message,
    });
  }
  return { success: false, errors };
}

/** Database row shape for profiles, parsed before use. */
export const profileRowSchema = z.object({
  timezone: z.string(),
  default_currency: z.string(),
  reminder_offsets: z.array(z.number().int()),
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
});

export interface Profile {
  timezone: string;
  defaultCurrency: string;
  reminderOffsets: number[];
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export function profileFromRow(row: unknown): Profile {
  const parsed = profileRowSchema.parse(row);
  return {
    timezone: parsed.timezone,
    defaultCurrency: parsed.default_currency,
    reminderOffsets: parsed.reminder_offsets,
    emailEnabled: parsed.email_enabled,
    pushEnabled: parsed.push_enabled,
  };
}
