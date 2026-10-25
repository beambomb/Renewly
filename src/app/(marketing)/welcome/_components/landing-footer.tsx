import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { strings } from "@/lib/strings";
import { LandingRing } from "./landing-ring";

export function LandingFooter() {
  return (
    <footer className="landing-footer bg-card">
      <LandingRing fraction={0.7} state="comfortable" decorative className="lr--footer" />
      <div className="landing-frame landing-footer__inner">
        <p className="landing-section-title inline-flex items-center gap-[0.3em]">
          <LogoMark className="size-[1em] shrink-0 text-foreground" />
          {strings.app.name}
        </p>
        <p className="landing-footer__tagline">{strings.app.tagline}</p>
        <nav className="landing-footer__links" aria-label={strings.app.name}>
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-base font-semibold text-on-primary transition-opacity duration-(--duration-press) hover:opacity-90 active:opacity-80"
          >
            {strings.landing.footer.signIn}
          </Link>
          <a
            href="#top"
            className="inline-flex min-h-11 items-center px-2 text-base font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {strings.landing.footer.backToTop}
          </a>
        </nav>
      </div>
    </footer>
  );
}
