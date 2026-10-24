import Link from "next/link";
import { CalendarClock, Wallet } from "lucide-react";
import type { UpcomingEntry } from "@/lib/dashboard/view";
import { formatDisplayDate } from "@/lib/dates/calendar";
import type { CurrencyTotal } from "@/lib/money/money";
import { formatMoney } from "@/lib/money/money";
import { strings } from "@/lib/strings";

const PANEL = "rounded-lg border border-border bg-card p-5 text-card-foreground";
const PANEL_TITLE = "flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground";

export function MonthlyCost({ totals }: { totals: CurrencyTotal[] }) {
  return (
    <section aria-labelledby="monthly-heading" className={`${PANEL} flex flex-col`}>
      <h2 id="monthly-heading" className={PANEL_TITLE}>
        <Wallet aria-hidden="true" size={18} />
        {strings.dashboard.monthlyTitle}
      </h2>
      {totals.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{strings.dashboard.monthlyNone}</p>
      ) : (
        <>
          <ul className="mt-3 flex flex-col gap-1">
            {totals.map((total, index) => (
              <li
                key={total.currency}
                className={index === 0 ? "text-[2rem] font-bold leading-tight" : "text-xl font-semibold text-muted-foreground"}
              >
                {formatMoney(total.monthlyMinor, total.currency)}
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-4 text-sm text-muted-foreground">{strings.dashboard.monthlyHint}</p>
        </>
      )}
    </section>
  );
}

export function Upcoming({ entries }: { entries: UpcomingEntry[] }) {
  const shown = entries.slice(0, 8);
  return (
    <section aria-labelledby="upcoming-heading" className={PANEL}>
      <h2 id="upcoming-heading" className={PANEL_TITLE}>
        <CalendarClock aria-hidden="true" size={18} />
        {strings.dashboard.upcomingTitle}
      </h2>
      {shown.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{strings.dashboard.upcomingNone}</p>
      ) : (
        <ul className="mt-2 grid gap-x-8 md:grid-cols-2">
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
