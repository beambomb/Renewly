import { Bell } from "lucide-react";
import { DEMO_STOPS } from "@/lib/landing/demo";
import { strings } from "@/lib/strings";
import { LandingRing } from "./landing-ring";
import { StateLine } from "./state-line";

const copy = strings.landing.reminders;

const STOPS = [
  { key: "week", id: "stop-week" },
  { key: "soon", id: "stop-soon" },
  { key: "day", id: "stop-day" },
] as const;

/**
 * Reminder timing: native radios drive the ring and text through :has(), no JavaScript.
 * DOM order is heading, stops, stage, so the chosen state is read right after the control.
 */
export function Reminders() {
  const base = DEMO_STOPS.soon;
  return (
    <section aria-labelledby="reminders-title" className="reminders landing-section bg-background">
      <div className="landing-frame reminders__grid">
        <div className="reminders__head">
          <h2 id="reminders-title" className="landing-section-title">
            {copy.heading}
          </h2>
          <p className="landing-lead">{copy.lead}</p>
        </div>

        <fieldset className="reminders__stops">
          <legend className="sr-only">{copy.legend}</legend>
          {STOPS.map(({ key, id }) => (
            <div key={key} className="reminders__stop">
              <input
                type="radio"
                name="reminder-stop"
                id={id}
                className="reminders__input sr-only"
                defaultChecked={key === "soon"}
              />
              <label htmlFor={id} className="rounded-full">
                {copy.stops[key]}
              </label>
            </div>
          ))}
        </fieldset>

        <div className="reminders__stage rounded-lg bg-card">
          <LandingRing fraction={base.fraction} state={base.state} decorative className="lr--stage">
            <div className="reminders__panels">
              {STOPS.map(({ key }) => {
                const ring = DEMO_STOPS[key];
                return (
                  <div key={key} className={`reminders__panel reminders__panel--${key}`}>
                    <span className="reminders__figure">{ring.daysLeft}</span>
                    <StateLine state={ring.state}>{ring.label}</StateLine>
                    <p className="reminders__chip rounded-full">
                      <Bell aria-hidden="true" size={16} strokeWidth={2} className="shrink-0" />
                      <span>{strings.landing.reminder.renewsIn(ring.name, ring.daysLeft)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </LandingRing>
        </div>
      </div>
    </section>
  );
}
