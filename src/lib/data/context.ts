import { todayIn, isValidTimeZone, type CalendarDate } from "@/lib/dates/calendar";
import { getProfile } from "@/lib/data/profile";
import type { Profile } from "@/lib/schemas/profile";
import { getUserId } from "@/lib/supabase/user";

export interface UserContext {
  userId: string;
  profile: Profile | null;
  timezone: string;
  /** The user's local calendar date right now. */
  today: CalendarDate;
}

/** Who is signed in, their time zone and local "today". Null when signed out. */
export async function getUserContext(now: Date = new Date()): Promise<UserContext | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const profile = await getProfile();
  const timezone = profile && isValidTimeZone(profile.timezone) ? profile.timezone : "UTC";
  return { userId, profile, timezone, today: todayIn(timezone, now) };
}
