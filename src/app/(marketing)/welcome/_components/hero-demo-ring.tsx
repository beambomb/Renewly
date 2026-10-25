import { Bell } from "lucide-react";
import { DEMO_HERO } from "@/lib/landing/demo";
import { initialsOf } from "@/lib/initials";
import { strings } from "@/lib/strings";
import { LandingRing } from "./landing-ring";
import { StateLine } from "./state-line";

/**
 * The giant hero ring. Server-rendered in its FINAL state (3 days, urgent, chip shown);
 * landing.css replays the draw, drain and state steps from the start.
 */
export function HeroDemoRing() {
  const ring = DEMO_HERO;
  return (
    <div className="hero-ring" data-hero-stage>
      <LandingRing fraction={ring.fraction} state={ring.state} label={ring.ariaLabel} halo className="lr--hero">
        <div className="hero-centre">
          <span aria-hidden="true" className="hero-mono">
            {initialsOf(ring.name)}
          </span>
          <span aria-hidden="true" className="hero-count" />
          <div className="hero-labels">
            <div aria-hidden="true" className="hero-label hero-label--ok">
              <StateLine state="comfortable">{strings.ring.state.comfortable}</StateLine>
            </div>
            <div aria-hidden="true" className="hero-label hero-label--soon">
              <StateLine state="soon">{strings.ring.state.soon}</StateLine>
            </div>
            <div className="hero-label hero-label--final">
              <StateLine state="urgent">{ring.label}</StateLine>
            </div>
          </div>
          <p className="hero-chip">
            <Bell aria-hidden="true" size={16} strokeWidth={2} className="shrink-0" />
            <span>{strings.landing.reminder.renewsIn(ring.name, ring.daysLeft)}</span>
          </p>
        </div>
      </LandingRing>
    </div>
  );
}
