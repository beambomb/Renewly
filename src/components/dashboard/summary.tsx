import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { UpcomingEntry } from "@/lib/dashboard/view";
import { formatDisplayDate } from "@/lib/dates/calendar";
import { strings } from "@/lib/strings";

export function Upcoming({ entries }: { entries: UpcomingEntry[] }) {
  const shown = entries.slice(0, 8);
  return (
    <section aria-labelledby="upcoming-heading" className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <h2
        id="upcoming-heading"
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <CalendarClock aria-hidden="true" size={18} />
        {strings.dashboard.upcomingTitle}
      </h2>
      {shown.length === 0 ? (
        <p className="mt-2 text-muted-foreground">{strings.dashboard.upcomingNone}</p>
      ) : (
        <ul className="mt-1 grid gap-x-8 md:grid-cols-2">
          {shown.map(({ item, dueDate, daysLeft }) => (
            <li key={item.id} className="border-b border-border last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
              <Link href={`/items/${item.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2 hover:underline">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-sm text-muted-foreground">{formatDisplayDate(dueDate)}</span>
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {daysLeft === 0 ? strings.ring.dueToday : daysLeft === 1 ? strings.ring.oneDayLeft : strings.ring.daysLeft(daysLeft)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
