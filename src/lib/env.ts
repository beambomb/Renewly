import { z } from "zod";

/**
 * Public (browser-safe) configuration, validated with zod.
 * Error messages name the variables only, never their values.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .url()
    .refine(
      (value) =>
        value.startsWith("https://") ||
        value.startsWith("http://localhost") ||
        value.startsWith("http://127.0.0.1"),
      "must be https (http only for localhost)",
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export type PublicEnvResult =
  | { ok: true; env: PublicEnv }
  | { ok: false; invalid: string[] };

export function parsePublicEnv(raw: Record<string, string | undefined>): PublicEnvResult {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: raw.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    NEXT_PUBLIC_SITE_URL: raw.NEXT_PUBLIC_SITE_URL || undefined,
  });
  if (result.success) return { ok: true, env: result.data };
  const invalid = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
  return { ok: false, invalid };
}

/**
 * Reads the public variables. Each one is referenced literally so Next.js can
 * inline it into the browser bundle.
 */
export function readPublicEnv(): PublicEnvResult {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
}

export function isSupabaseConfigured(): boolean {
  return readPublicEnv().ok;
}

export function getPublicEnv(): PublicEnv {
  const result = readPublicEnv();
  if (!result.ok) {
    throw new Error(
      `Missing or invalid environment variables: ${result.invalid.join(", ")}. Copy .env.example to .env.local and fill them in.`,
    );
  }
  return result.env;
}
