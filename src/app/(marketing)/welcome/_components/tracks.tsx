import { DEMO_TRACKS } from "@/lib/landing/demo";
import { strings } from "@/lib/strings";
import { SectionIcon } from "@/components/sections/section-icon";
import type { ItemKind } from "@/lib/items/types";
import { LandingRing } from "./landing-ring";
import { StateLine } from "./state-line";

const copy = strings.landing.tracks;

const BANDS: { kind: Extract<ItemKind, "subscription" | "recurring" | "warranty">; tone: string }[] = [
  { kind: "subscription", tone: "bg-card" },
  { kind: "recurring", tone: "bg-background" },
  { kind: "warranty", tone: "bg-card" },
];

export function Tracks() {
  return (
    <section id="how-it-works" aria-labelledby="tracks-title">
      <h2 id="tracks-title" className="sr-only">
        {copy.heading}
      </h2>
      <ul role="list">
        {BANDS.map(({ kind, tone }) => {
          const ring = DEMO_TRACKS[kind];
          return (
            <li key={kind} className={`landing-band ${tone}`}>
              <div className="landing-frame landing-band__grid">
                <div className="landing-band__copy">
                  <h3 className="landing-section-title">{copy[kind].sentence}</h3>
                  <p className="landing-band__detail">{copy[kind].detail}</p>
                </div>
                <div className="landing-band__ring">
                  <LandingRing
                    fraction={ring.fraction}
                    state={ring.state}
                    label={ring.ariaLabel}
                    className="lr--track lr--scrub"
                  >
                    <span className="text-muted-foreground">
                      <SectionIcon kind={kind} size={32} />
                    </span>
                  </LandingRing>
                  <div className="landing-band__meta">
                    <p className="text-base font-medium text-foreground">{ring.name}</p>
                    <StateLine state={ring.state}>{ring.label}</StateLine>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
