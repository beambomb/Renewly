import { PiggyBank, Target, TrendingUp } from "lucide-react";
import { formatMoney } from "@/lib/money/money";
import { deadlineText, savingsAriaLabel, type SavingsProgress } from "@/lib/savings/savings";
import { strings } from "@/lib/strings";

const FILL_CLASS = {
  in_progress: "bg-accent",
  completed: "bg-status-ok",
  overdue: "bg-status-overdue",
} as const;

const STATE_TEXT_CLASS = {
  in_progress: "text-muted-foreground",
  completed: "text-status-ok",
  overdue: "text-status-overdue",
} as const;

interface Props {
  name: string;
  emoji?: string | null | undefined;
  currency: string;
  progress: SavingsProgress;
  /** Smaller layout for lists. */
  compact?: boolean;
}

/**
 * Wallet-style card for a savings goal. Deliberately not a ring: it shows how
 * much is saved against the target with a horizontal bar, and says the same
 * thing in words (percent, amount to go, deadline) so colour is never the only signal.
 */
export function SavingsCard({ name, emoji, currency, progress, compact = false }: Props) {
  const saved = formatMoney(progress.savedMinor, currency);
  const target = formatMoney(progress.targetMinor, currency);
  const stateLabel = strings.savings.state[progress.state];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-accent">
          {emoji ? (
            <span aria-hidden="true" className="text-xl leading-none">
              {emoji}
            </span>
          ) : (
            <PiggyBank aria-hidden="true" size={22} />
          )}
        </span>
        <p className="min-w-0 flex-1 truncate font-semibold">{name}</p>
        <p className={`flex shrink-0 items-center gap-1 text-sm font-medium ${STATE_TEXT_CLASS[progress.state]}`}>
          {progress.state === "completed" ? <Target aria-hidden="true" size={16} /> : <TrendingUp aria-hidden="true" size={16} />}
          {stateLabel}
        </p>
      </div>

      <div>
        <p className={compact ? "text-xl font-bold" : "text-[2rem] font-bold leading-tight"}>{saved}</p>
        <p className="text-sm text-muted-foreground">{strings.savings.ofTarget(target)}</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={savingsAriaLabel(name, progress, currency)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          className="h-3 flex-1 overflow-hidden rounded-full bg-track"
        >
          <div
            className={`h-full rounded-full ${FILL_CLASS[progress.state]}`}
            style={{ width: `${Math.max(progress.percent, progress.savedMinor > 0 ? 2 : 0)}%` }}
          />
        </div>
        <p className="w-12 shrink-0 text-right text-sm font-semibold">{progress.percent}%</p>
      </div>

      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        <li>
          {progress.completed ? strings.savings.goalReached : strings.savings.toGo(formatMoney(progress.remainingMinor, currency))}
        </li>
        {!compact || progress.daysToDeadline !== null ? <li>{deadlineText(progress.daysToDeadline)}</li> : null}
        {progress.neededPerMonthMinor !== null && !compact ? (
          <li>{strings.savings.perMonth(formatMoney(progress.neededPerMonthMinor, currency))}</li>
        ) : null}
      </ul>
    </div>
  );
}
