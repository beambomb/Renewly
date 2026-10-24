import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DetectTimezone } from "@/components/shell/detect-timezone";
import { getProfile } from "@/lib/data/profile";
import { isSupabaseConfigured } from "@/lib/env";

// Everything in the app shell is per-user, so it must never be statically cached.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Without Supabase configured (local UI work on /dev pages) there is no profile.
  const profile = isSupabaseConfigured() ? await getProfile() : null;

  return (
    <AppShell>
      {profile ? <DetectTimezone current={profile.timezone} /> : null}
      {children}
    </AppShell>
  );
}
