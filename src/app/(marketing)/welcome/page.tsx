import type { Metadata } from "next";
import { strings } from "@/lib/strings";
import { Hero } from "./_components/hero";
import { LandingFooter } from "./_components/landing-footer";
import { LandingHeader } from "./_components/landing-header";
import { Reminders } from "./_components/reminders";
import { Tracks } from "./_components/tracks";

const { title, description } = strings.landing.meta;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: strings.app.name, title, description, locale: "en_US" },
  twitter: { card: "summary", title, description },
};

// Served at "/" for signed-out visitors via a proxy rewrite (see src/lib/auth/access.ts).
export default function WelcomePage() {
  return (
    <>
      <LandingHeader />
      <main id="main">
        <Hero />
        <Tracks />
        <Reminders />
      </main>
      <LandingFooter />
    </>
  );
}
