import { formatDisplayDate } from "@/lib/dates/calendar";
import type { Item } from "@/lib/items/types";
import { formatMoney, monthlyMinor } from "@/lib/money/money";
import { strings } from "@/lib/strings";

const t = strings.detail.facts;

type Fact = { label: string; value: React.ReactNode };

function repeatText(item: Item): string {
  if (item.billingCycle === null) return t.doesNotRepeat;
  if (item.billingCycle === "custom" && item.cycleDays) return t.everyNDays(item.cycleDays);
  return strings.item.cycles[item.billingCycle];
}

function factsFor(item: Item, defaultOffsets: readonly number[]): Fact[] {
  const facts: Fact[] = [];
  const date = (value: string | null) => (value ? formatDisplayDate(value) : "-");

  switch (item.kind) {
    case "subscription":
      if (item.priceMinor !== null && item.currency) {
        const cycle = item.billingCycle ? strings.item.cycles[item.billingCycle].toLowerCase() : "";
        facts.push({ label: t.price, value: `${formatMoney(item.priceMinor, item.currency)} (${cycle})` });
        if (item.billingCycle && item.billingCycle !== "monthly") {
          facts.push({
            label: strings.item.fields.billingCycle,
            value: t.perMonth(
              formatMoney(Math.round(monthlyMinor(item.priceMinor, item.billingCycle, item.cycleDays)), item.currency),
            ),
          });
        }
      }
      facts.push({ label: t.nextBilling, value: date(item.dueDate) });
      if (item.paymentMethod) facts.push({ label: t.payment, value: item.paymentMethod });
      facts.push({ label: t.autoRenew, value: item.autoRenew ? t.yes : t.no });
      if (item.cancelUrl) {
        facts.push({
          label: t.cancelLink,
          value: (
            <a href={item.cancelUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {t.cancelLinkOpen}
            </a>
          ),
        });
      }
      break;
    case "recurring":
      facts.push({ label: t.lastBought, value: date(item.lastPurchasedOn) });
      if (item.durationDays) facts.push({ label: t.lastsAbout, value: t.days(item.durationDays) });
      if (item.usualPriceMinor !== null && item.usualCurrency) {
        facts.push({ label: t.usualPrice, value: formatMoney(item.usualPriceMinor, item.usualCurrency) });
      }
      if (item.usualStore) facts.push({ label: t.usualStore, value: item.usualStore });
      if (item.usualQuantity !== null) facts.push({ label: t.usualQuantity, value: String(item.usualQuantity) });
      break;
    case "warranty":
      facts.push({ label: t.purchased, value: date(item.purchasedOn) });
      if (item.warrantyMonths) facts.push({ label: t.warrantyLength, value: t.months(item.warrantyMonths) });
      facts.push({ label: t.expires, value: date(item.expiresOn) });
      if (item.serialNumber) facts.push({ label: t.serial, value: item.serialNumber });
      break;
    case "reminder":
      facts.push({ label: t.date, value: date(item.dueDate) });
      facts.push({ label: t.repeats, value: repeatText(item) });
      break;
    case "savings":
      if (item.dueDate) facts.push({ label: t.deadline, value: date(item.dueDate) });
      break;
  }

  if (item.category) facts.push({ label: t.category, value: item.category });

  const offsets = item.reminderOffsets ?? [...defaultOffsets];
  facts.push({
    label: t.reminders,
    value:
      item.reminderOffsets === null
        ? t.defaultReminders
        : offsets.length === 0
          ? strings.detail.facts.no
          : t.onDays(offsets.map((d) => strings.settings.offsetLabel(d).toLowerCase()).join(", ")),
  });
  if (item.notes) facts.push({ label: t.notes, value: <span className="whitespace-pre-wrap">{item.notes}</span> });
  return facts;
}

export function ItemFacts({ item, defaultOffsets }: { item: Item; defaultOffsets: readonly number[] }) {
  const facts = factsFor(item, defaultOffsets);
  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-card text-card-foreground">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-1 p-4 sm:flex-row sm:justify-between sm:gap-6">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="font-medium sm:text-right">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
