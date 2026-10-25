import { SectionIcon } from "@/components/sections/section-icon";
import type { ItemKind } from "@/lib/items/types";
import { formatMoney } from "@/lib/money/money";
import type { SectionCost } from "@/lib/money/section-cost";
import { strings } from "@/lib/strings";

interface Props {
  kind: ItemKind;
  count: number;
  cost: SectionCost | null;
  className?: string;
}

/** First cell of every Home section: identity and, where it has one, the monthly cost per currency. */
export function SectionSummary({ kind, count, cost, className = "" }: Props) {
  const totals = cost?.totals ?? [];
  const unit = cost?.estimated ? strings.dashboard.perMonthEstimate : strings.dashboard.perCycle.monthly;
  return (
    <div className={`@container flex flex-col gap-3 rounded-lg border border-border bg-muted p-4 text-card-foreground ${className}`}>
      <h2
        id={`${kind}-heading`}
        className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        <span className="text-secondary">
          <SectionIcon kind={kind} size={18} />
        </span>
        {strings.item.kinds[kind].plural}
        <span className="font-normal">{count}</span>
      </h2>
      {totals.length > 0 ? (
        <div className="mt-auto flex flex-col gap-1">
          <ul className="flex flex-col gap-1">
            {totals.map((total) => (
              <li key={total.currency} className="whitespace-nowrap text-xl font-bold leading-tight tabular-nums @[16rem]:text-2xl">
                {formatMoney(total.monthlyMinor, total.currency)}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{unit}</p>
        </div>
      ) : null}
    </div>
  );
}
