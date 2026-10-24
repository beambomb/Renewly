import { SectionIcon } from "@/components/sections/section-icon";
import type { ItemKind } from "@/lib/items/types";
import { formatMoney } from "@/lib/money/money";
import type { SectionCost } from "@/lib/money/section-cost";
import { strings } from "@/lib/strings";

interface Props {
  kind: ItemKind;
  count: number;
  cost: SectionCost | null;
}

/** Section title with its monthly figure leftmost, so each section shows what it costs per month. */
export function SectionHeader({ kind, count, cost }: Props) {
  const totals = cost?.totals ?? [];
  const unit = cost?.estimated ? strings.dashboard.perMonthEstimate : strings.dashboard.perCycle.monthly;
  return (
    <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
      {totals.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-x-2">
          <ul className="flex flex-wrap items-baseline gap-x-2 text-2xl font-bold tabular-nums text-foreground">
            {totals.map((total, index) => (
              <li key={total.currency} className="flex items-baseline gap-x-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="font-normal text-muted-foreground">
                    ·
                  </span>
                ) : null}
                {formatMoney(total.monthlyMinor, total.currency)}
              </li>
            ))}
          </ul>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      ) : null}
      <h2 id={`${kind}-heading`} className="flex items-center gap-2 text-xl font-semibold text-foreground">
        <span className="text-secondary">
          <SectionIcon kind={kind} size={22} />
        </span>
        {strings.item.kinds[kind].plural}
        <span className="text-base font-normal text-muted-foreground">{count}</span>
      </h2>
    </header>
  );
}
