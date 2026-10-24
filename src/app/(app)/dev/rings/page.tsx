import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RingCard, type RingLogo } from "@/components/ring/ring";
import { computeRing, type RingInput } from "@/lib/rings/ring";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: strings.dev.ringsTitle };

// A neutral inline SVG so the gallery needs no storage access.
const SAMPLE_LOGO: RingLogo = {
  src:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1E3A8A"/><path d="M18 46V18l28 28V18" fill="none" stroke="#FFFFFF" stroke-width="6"/></svg>',
    ),
};

const TODAY = "2026-10-24";

interface Sample {
  input: RingInput;
  logo?: RingLogo;
  detail?: string;
}

const SAMPLES: Sample[] = [
  { input: { kind: "subscription", status: "active", name: "Netflix", periodStart: "2026-10-12", dueDate: "2026-11-12" }, logo: SAMPLE_LOGO, detail: "$15.49 monthly" },
  { input: { kind: "subscription", status: "active", name: "Gym", periodStart: "2026-10-12", dueDate: "2026-11-09" }, logo: { emoji: "🏋️" } },
  { input: { kind: "recurring", status: "active", name: "Coffee beans", periodStart: "2026-10-14", dueDate: "2026-10-28" }, logo: { emoji: "☕" }, detail: "Every 14 days" },
  { input: { kind: "subscription", status: "active", name: "Spotify", periodStart: "2026-09-27", dueDate: "2026-10-27" }, detail: "$11.99 monthly" },
  { input: { kind: "recurring", status: "active", name: "Toothpaste", periodStart: "2026-08-28", dueDate: "2026-10-27" } },
  { input: { kind: "subscription", status: "active", name: "Meal box", periodStart: "2026-10-19", dueDate: "2026-10-26" } },
  { input: { kind: "subscription", status: "active", name: "Renews today", periodStart: "2026-09-24", dueDate: "2026-10-24" } },
  { input: { kind: "subscription", status: "active", name: "Domain name", periodStart: "2025-10-21", dueDate: "2026-10-21" }, detail: "Not auto-renewing" },
  { input: { kind: "recurring", status: "active", name: "Water filter", periodStart: "2026-07-16", dueDate: "2026-10-14" } },
  { input: { kind: "warranty", status: "active", name: "Laptop", periodStart: "2025-09-20", dueDate: "2028-09-20" }, detail: "Expires 20 Sep 2028" },
  { input: { kind: "warranty", status: "active", name: "Headphones", periodStart: "2024-11-20", dueDate: "2026-11-20" } },
  { input: { kind: "warranty", status: "active", name: "Washing machine", periodStart: "2024-01-28", dueDate: "2026-01-28" } },
  { input: { kind: "subscription", status: "paused", name: "Magazine", periodStart: "2026-10-01", dueDate: "2026-11-01" } },
  { input: { kind: "subscription", status: "cancelled", name: "Old VPN", periodStart: "2026-10-01", dueDate: "2026-11-01" } },
];

export default function RingGalleryPage() {
  // Development helper only; never exposed in production.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <h1 className="text-[2rem] font-bold leading-tight text-foreground">{strings.dev.ringsTitle}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">{strings.dev.ringsLead}</p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">{strings.dev.card}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {SAMPLES.map(({ input, logo, detail }) => (
          <li key={input.name} className="rounded-lg border border-border bg-card p-4">
            <RingCard
              name={input.name}
              vm={computeRing(input, TODAY)}
              status={input.status}
              size="md"
              {...(logo ? { logo } : {})}
              {...(detail ? { detail } : {})}
            />
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-foreground">{strings.dev.detail}</h2>
      <div className="mt-4 flex flex-wrap gap-6 rounded-lg border border-border bg-card p-6">
        {SAMPLES.slice(0, 4).map(({ input, logo }) => (
          <RingCard
            key={input.name}
            name={input.name}
            vm={computeRing(input, TODAY)}
            status={input.status}
            size="lg"
            {...(logo ? { logo } : {})}
          />
        ))}
      </div>
    </>
  );
}
