import { createClient } from "./server";

/**
 * The signed-in user's id from the verified token claims, or null.
 * Server-side only. RLS still enforces ownership; this id is used for filters.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}
