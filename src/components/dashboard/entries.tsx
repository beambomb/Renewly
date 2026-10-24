import Link from "next/link";
import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { Ring, RingCard, TimeLabel } from "@/components/ring/ring";
import { SavingsCard } from "@/components/savings/savings-card";
import type { DashboardEntry } from "@/lib/dashboard/view";
import { formatDisplayDate } from "@/lib/dates/calendar";
import type { Item } from "@/lib/items/types";
import { formatMoney } from "@/lib/money/money";
import { strings } from "@/lib/strings";

const CARD =
  "block rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted active:bg-muted cv-auto";

function priceDetail(item: Item): ReactNode {
  if (item.kind === "subscription" && item.priceMinor !== null && item.currency && item.billingCycle) {
    return `${formatMoney(item.priceMinor, item.currency)} ${strings.dashboard.perCycle[item.billingCycle]}`;
  }
  if (item.kind === "recurring" && item.usualPriceMinor !== null && item.usualCurrency) {
    return formatMoney(item.usualPriceMinor, item.usualCurrency);
  }
  if (item.kind === "warranty" && item.dueDate) return formatDisplayDate(item.dueDate);
  return undefined;
}

/** A time-based item as a ring card (subscriptions, recurring purchases, warranties). */
export function RingEntry({ entry }: { entry: Extract<DashboardEntry, { type: "time" }> }) {
  const { item, ring } = entry;
  return (
    <Link href={`/items/${item.id}`} className={CARD}>
      <RingCard
        name={item.name}
        vm={ring}
        status={item.status}
        logo={{ emoji: item.emoji }}
        detail={priceDetail(item)}
      />
    </Link>
  );
}

/** A reminder as a compact row: small ring, title, date and a one-tap Done. */
export function ReminderRow({
  entry,
  markDone,
}: {
  entry: Extract<DashboardEntry, { type: "time" }>;
  markDone: () => Promise<void>;
}) {
  const { item, ring } = entry;
  const canMarkDone = item.status === "active";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-card-foreground cv-auto">
      <Link
        href={`/items/${item.id}`}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-md p-1 hover:bg-muted"
      >
        <Ring name={item.name} vm={ring} logo={{ emoji: item.emoji }} size="sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{item.name}</span>
          <TimeLabel vm={ring} status={item.status} />
          {item.dueDate ? <span className="text-sm text-muted-foreground">{formatDisplayDate(item.dueDate)}</span> : null}
        </span>
      </Link>
      {canMarkDone ? (
        <form action={markDone}>
          <button
            type="submit"
            aria-label={strings.dashboard.markDoneFor(item.name)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-muted-foreground px-3 text-sm font-medium text-foreground hover:bg-muted active:bg-muted"
          >
            <CircleCheck aria-hidden="true" size={18} />
            <span>{strings.dashboard.markDone}</span>
          </button>
        </form>
      ) : null}
    </div>
  );
}

/** A savings goal as a wallet-style progress card. */
export function SavingsEntry({ entry }: { entry: Extract<DashboardEntry, { type: "savings" }> }) {
  const { item, progress } = entry;
  if (!item.currency) return null;
  return (
    <Link href={`/items/${item.id}`} className="block rounded-lg cv-auto">
      <SavingsCard name={item.name} emoji={item.emoji} currency={item.currency} progress={progress} compact />
    </Link>
  );
}
