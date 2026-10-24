import type { Metadata } from "next";
import { getProfile } from "@/lib/data/profile";
import { currencyOptions, timeZoneOptions } from "@/lib/options";
import { strings } from "@/lib/strings";
import { signOut } from "./actions";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = { title: strings.pages.settingsTitle };

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-[2rem] font-bold leading-tight text-foreground">{strings.pages.settingsTitle}</h1>
        <p className="mt-2 text-muted-foreground">{strings.pages.settingsLead}</p>
      </div>

      {profile ? (
        <SettingsForm profile={profile} timeZones={timeZoneOptions(profile.timezone)} currencies={currencyOptions()} />
      ) : (
        <p role="alert" className="rounded-md border border-destructive p-3 text-destructive">
          {strings.form.saveFailed}
        </p>
      )}

      <section aria-labelledby="account-heading" className="border-t border-border pt-6">
        <h2 id="account-heading" className="text-xl font-semibold text-foreground">
          {strings.settings.accountHeading}
        </h2>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="min-h-11 rounded-md border border-muted-foreground px-6 font-medium text-foreground transition-colors duration-[var(--duration-press)] active:bg-muted"
          >
            {strings.settings.signOut}
          </button>
        </form>
      </section>
    </div>
  );
}
