import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CircleCheck, Pause, Pencil, Play, RotateCcw } from "lucide-react";
import { RingCard } from "@/components/ring/ring";
import { SectionIcon } from "@/components/sections/section-icon";
import { SavingsCard } from "@/components/savings/savings-card";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/components/form/fields";
import { getUserContext } from "@/lib/data/context";
import { getItem, listSavingsEntries } from "@/lib/data/items";
import { formatDisplayDate } from "@/lib/dates/calendar";
import type { Item } from "@/lib/items/types";
import { formatMoney } from "@/lib/money/money";
import { computeRing } from "@/lib/rings/ring";
import { computeSavings } from "@/lib/savings/savings";
import { strings } from "@/lib/strings";
import { deleteItem, deleteSavingsEntry, markReminderDone, reopenReminder, setItemStatus } from "../actions";
import { DeleteDialog } from "./_components/delete-dialog";
import { ItemFacts } from "./_components/item-facts";
import { SavingsEntryForm } from "./_components/savings-entry-form";
import { addSavingsEntry } from "../actions";

export const metadata: Metadata = { title: strings.detail.title };

const a = strings.detail.actions;

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getUserContext();
  if (!context) redirect("/sign-in");
  const item = await getItem(id);
  if (!item) notFound();

  const defaultOffsets = context.profile?.reminderOffsets ?? [7, 3, 1, 0];

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-muted-foreground underline-offset-4 hover:underline">
        <ArrowLeft aria-hidden="true" size={18} />
        {strings.detail.back}
      </Link>

      <header className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-muted text-secondary">
          <SectionIcon kind={item.kind} />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{strings.item.kinds[item.kind].name}</p>
          <h1 className="truncate text-[2rem] font-bold leading-tight text-foreground">{item.name}</h1>
        </div>
      </header>

      {item.kind === "savings" ? (
        <SavingsSection item={item} today={context.today} />
      ) : (
        <TimeSection item={item} today={context.today} />
      )}

      <ItemFacts item={item} defaultOffsets={defaultOffsets} />

      <StatusNote item={item} />
      <Actions item={item} />
    </div>
  );
}

function TimeSection({ item, today }: { item: Item; today: string }) {
  if (!item.periodStart || !item.dueDate) return null;
  const vm = computeRing(
    { kind: item.kind, status: item.status, name: item.name, periodStart: item.periodStart, dueDate: item.dueDate },
    today,
  );
  return (
    <section className="grid place-items-center rounded-lg border border-border bg-card p-6" aria-label={item.name}>
      <RingCard
        name={item.name}
        vm={vm}
        status={item.status}
        size="lg"
        logo={{ emoji: item.emoji }}
        detail={item.dueDate ? formatDisplayDate(item.dueDate) : undefined}
      />
    </section>
  );
}

async function SavingsSection({ item, today }: { item: Item; today: string }) {
  if (item.targetMinor === null || item.savedMinor === null || !item.currency) return null;
  const progress = computeSavings(
    { targetMinor: item.targetMinor, savedMinor: item.savedMinor, deadline: item.dueDate },
    today,
  );
  const entries = await listSavingsEntries(item.id);
  const currency = item.currency;

  return (
    <>
      <SavingsCard name={item.name} emoji={item.emoji} currency={currency} progress={progress} />

      <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <SavingsEntryForm action={addSavingsEntry.bind(null, item.id)} today={today} />
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-xl font-semibold text-foreground">
          {strings.savingsEntry.history}
        </h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-muted-foreground">{strings.savingsEntry.historyEmpty}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card text-card-foreground">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{strings.savingsEntry.types[entry.entryType]}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {formatDisplayDate(entry.occurredOn)}
                    {entry.note ? ` - ${entry.note}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">
                  {entry.amountMinor > 0 ? "+" : ""}
                  {formatMoney(entry.amountMinor, currency)}
                </p>
                <form action={deleteSavingsEntry.bind(null, item.id, entry.id)}>
                  <button type="submit" className="min-h-11 rounded-md px-3 text-sm text-muted-foreground underline">
                    {strings.savingsEntry.remove}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function StatusNote({ item }: { item: Item }) {
  if (item.status === "active") return null;
  return (
    <p role="status" className="rounded-md border border-border bg-card p-3 text-card-foreground">
      {strings.detail.statusNote[item.status]}
    </p>
  );
}

function Actions({ item }: { item: Item }) {
  const isReminder = item.kind === "reminder";
  const canPause = item.status === "active";
  const canResume = item.status === "paused" || item.status === "cancelled";

  return (
    <section aria-label={strings.detail.actionsLabel} className="flex flex-col gap-3 border-t border-border pt-6">
      {isReminder && item.status === "active" && (
        <form action={markReminderDone.bind(null, item.id, `/items/${item.id}`)}>
          <button type="submit" className={`${PRIMARY_BUTTON} w-full`}>
            <CircleCheck aria-hidden="true" size={18} />
            {item.billingCycle ? a.markDoneRepeating : a.markDone}
          </button>
        </form>
      )}
      {isReminder && item.status === "done" && (
        <form action={reopenReminder.bind(null, item.id)}>
          <button type="submit" className={`${SECONDARY_BUTTON} w-full`}>
            <RotateCcw aria-hidden="true" size={18} />
            {a.reopen}
          </button>
        </form>
      )}

      <Link href={`/items/${item.id}/edit`} className={`${SECONDARY_BUTTON} w-full`}>
        <Pencil aria-hidden="true" size={18} />
        {a.edit}
      </Link>

      {canPause && (
        <form action={setItemStatus.bind(null, item.id, "paused")}>
          <button type="submit" className={`${SECONDARY_BUTTON} w-full`}>
            <Pause aria-hidden="true" size={18} />
            {a.pause}
          </button>
        </form>
      )}
      {canResume && (
        <form action={setItemStatus.bind(null, item.id, "active")}>
          <button type="submit" className={`${SECONDARY_BUTTON} w-full`}>
            <Play aria-hidden="true" size={18} />
            {a.resume}
          </button>
        </form>
      )}
      {item.kind === "subscription" && item.status !== "cancelled" && (
        <form action={setItemStatus.bind(null, item.id, "cancelled")}>
          <button type="submit" className={`${SECONDARY_BUTTON} w-full`}>
            {a.cancelSubscription}
          </button>
        </form>
      )}

      <DeleteDialog name={item.name} action={deleteItem.bind(null, item.id)} />
    </section>
  );
}
