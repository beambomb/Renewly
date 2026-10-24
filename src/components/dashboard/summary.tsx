import Link from "next/link";
import { CalendarClock, Wallet } from "lucide-react";
import type { UpcomingEntry } from "@/lib/dashboard/view";
import { formatDisplayDate } from "@/lib/dates/calendar";
import type { CurrencyTotal } from "@/lib/money/money";
import { formatMoney } from "@/lib/money/money";
import { strings } from "@/lib/strings";

const PANEL = "rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm";

export function MonthlyCost({ totals }: { totals: CurrencyTotal[] }) {
  return (
    <section aria-labelledby="monthly-heading" className={PANEL}>
      <h2 id="monthly-heading" className="flex items-center gap-2 text-base font-semibold">
        <Wallet aria-hidden="true" size={20} className="text-secondary" />
        {strings.dashboard.monthlyTitle}
      </h2>
      {totals.length === 0 ? (
        <p className="mt-2 text-muted-foreground">{strings.dashboard.monthlyNone}</p>
      ) : (
        <>
          <ul className="mt-2 flex flex-col gap-1">
            {totals.map((total) => (
              <li key={total.currency} className="text-[1.5rem] font-bold leading-tight">
                {formatMoney(total.monthlyMinor, total.currency)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">{strings.dashboard.monthlyHint}</p>
        </>
      )}
    </section>
  );
}

export function Upcoming({ entries }: { entries: UpcomingEntry[] }) {
  const shown = entries.slice(0, 8);
  return (
    <section aria-labelledby="upcoming-heading" className={PANEL}>
      <h2 id="upcoming-heading" className="flex items-center gap-2 text-base font-semibold">
        <CalendarClock aria-hidden="true" size={20} className="text-secondary" />
        {strings.dashboard.upcomingTitle}
      </h2>
      {shown.length === 0 ? (
        <p className="mt-2 text-muted-foreground">{strings.dashboard.upcomingNone}</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {shown.map(({ item, dueDate, daysLeft }) => (
            <li key={item.id}>
              <Link href={`/items/${item.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2 hover:underline">
                <span className="min-w-0 truncate font-medium">{item.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {daysLeft === 0 ? strings.ring.dueToday : daysLeft === 1 ? strings.ring.oneDayLeft : strings.ring.daysLeft(daysLeft)}
                  {" - "}
                  {formatDisplayDate(dueDate)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
