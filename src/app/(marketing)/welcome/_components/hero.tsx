import type { CSSProperties } from "react";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { DEMO_HERO, DEMO_SATELLITES } from "@/lib/landing/demo";
import { strings } from "@/lib/strings";
import { HeroDemoRing } from "./hero-demo-ring";
import { HeroStage } from "./hero-stage";
import { LandingRing } from "./landing-ring";
import { StateLine } from "./state-line";

const copy = strings.landing.hero;

export function Hero() {
  return (
    <HeroStage>
      <div className="landing-hero__inner">
        <div className="landing-hero__text">
          <h1 id="hero-title" className="landing-display">
            {copy.headline}
          </h1>
          <p className="landing-lead">{copy.lead}</p>
          <p className="sr-only">{copy.sequenceSummary(DEMO_HERO.name, 30, DEMO_HERO.daysLeft)}</p>
          <div className="landing-actions">
            <Link
              href="/sign-in"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-on-primary transition-opacity duration-(--duration-press) hover:opacity-90 active:opacity-80"
            >
              {copy.signIn}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-base font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-(--duration-fast) hover:decoration-foreground"
            >
              {copy.howItWorks}
              <ArrowDown aria-hidden="true" size={16} strokeWidth={2} />
            </a>
          </div>
        </div>

        <HeroDemoRing />

        <div className="landing-hero__satellites">
          <ul className="landing-satellites" role="list">
            {DEMO_SATELLITES.map((ring, index) => (
              <li key={ring.name} className="landing-satellite" style={{ "--index": index } as CSSProperties}>
                <LandingRing fraction={ring.fraction} state={ring.state} label={ring.ariaLabel} className="lr--satellite" />
                <div className="landing-satellite__text">
                  <p className="text-base font-medium text-foreground">{ring.name}</p>
                  <StateLine state={ring.state} className="!justify-start">
                    {ring.label}
                  </StateLine>
                </div>
              </li>
            ))}
          </ul>
          <p className="landing-note">{copy.exampleNote}</p>
        </div>
      </div>
    </HeroStage>
  );
}
