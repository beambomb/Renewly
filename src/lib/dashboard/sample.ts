import { addDays, addMonths, type CalendarDate } from "@/lib/dates/calendar";
import type { Item } from "@/lib/items/types";

let counter = 0;

function blank(overrides: Partial<Item>): Item {
  counter += 1;
  return {
    id: `sample-${counter}`,
    kind: "subscription",
    name: "Sample",
    category: null,
    notes: null,
    emoji: null,
    logoPath: null,
    status: "active",
    reminderOffsets: null,
    periodStart: null,
    dueDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    priceMinor: null,
    currency: null,
    billingCycle: null,
    cycleDays: null,
    billingAnchorDay: null,
    paymentMethod: null,
    autoRenew: null,
    cancelUrl: null,
    lastPurchasedOn: null,
    durationDays: null,
    usualPriceMinor: null,
    usualCurrency: null,
    usualStore: null,
    usualQuantity: null,
    purchasedOn: null,
    warrantyMonths: null,
    expiresOn: null,
    serialNumber: null,
    receiptPath: null,
    targetMinor: null,
    savedMinor: null,
    ...overrides,
  };
}

/** Demo items spread across all five sections, relative to `today`. Used by the dev preview only. */
export function sampleItems(today: CalendarDate): Item[] {
  counter = 0;
  const sub = (name: string, emoji: string, due: number, priceMinor: number, currency: string, extra: Partial<Item> = {}) =>
    blank({
      kind: "subscription",
      name,
      emoji,
      category: "Subscriptions",
      dueDate: addDays(today, due),
      periodStart: addMonths(addDays(today, due), -1),
      priceMinor,
      currency,
      billingCycle: "monthly",
      autoRenew: true,
      ...extra,
    });

  return [
    sub("Netflix", "🎬", 12, 18_600_000 / 100, "IDR"),
    sub("Spotify", "🎧", 3, 5_490_000 / 100, "IDR"),
    sub("iCloud 200 GB", "☁️", 25, 299, "USD", { category: "Cloud" }),
    sub("Gym", "🏋️", 16, 3500, "EUR", { billingCycle: "custom", cycleDays: 28, periodStart: addDays(today, -12) }),
    sub("Domain name", "🌐", -3, 1499, "USD", { billingCycle: "yearly", autoRenew: false, periodStart: addDays(today, -368) }),
    sub("Old VPN", "🔒", 20, 899, "USD", { status: "cancelled" }),

    blank({ kind: "reminder", name: "Bayar listrik", emoji: "💡", category: "Bills", periodStart: addMonths(addDays(today, 2), -1), dueDate: addDays(today, 2), billingCycle: "monthly", billingAnchorDay: 26 }),
    blank({ kind: "reminder", name: "Perpanjang paspor", emoji: "🛂", category: "Documents", periodStart: addDays(today, -40), dueDate: addDays(today, 38) }),
    blank({ kind: "reminder", name: "Service motor", emoji: "🛵", category: "Vehicle", periodStart: addDays(today, -20), dueDate: addDays(today, -1) }),
    blank({ kind: "reminder", name: "Kirim laporan", emoji: "📄", status: "done", periodStart: addDays(today, -5), dueDate: addDays(today, -2) }),

    blank({ kind: "savings", name: "Dana darurat", emoji: "🛟", category: "Goals", currency: "IDR", targetMinor: 50_000_000, savedMinor: 12_500_000 }),
    blank({ kind: "savings", name: "Liburan Jepang", emoji: "🗾", category: "Goals", currency: "IDR", targetMinor: 30_000_000, savedMinor: 21_000_000, periodStart: addDays(today, -120), dueDate: addDays(today, 150) }),
    blank({ kind: "savings", name: "Laptop baru", emoji: "💻", category: "Goals", currency: "IDR", targetMinor: 15_000_000, savedMinor: 15_000_000, periodStart: addDays(today, -200), dueDate: addDays(today, 30) }),
    blank({ kind: "savings", name: "Kado ulang tahun", emoji: "🎁", category: "Goals", currency: "IDR", targetMinor: 2_000_000, savedMinor: 600_000, periodStart: addDays(today, -60), dueDate: addDays(today, -5) }),

    blank({ kind: "recurring", name: "Biji kopi", emoji: "☕", category: "Groceries", lastPurchasedOn: addDays(today, -10), durationDays: 14, periodStart: addDays(today, -10), dueDate: addDays(today, 4), usualPriceMinor: 120_000, usualCurrency: "IDR" }),
    blank({ kind: "recurring", name: "Deterjen", emoji: "🧺", category: "Household", lastPurchasedOn: addDays(today, -20), durationDays: 45, periodStart: addDays(today, -20), dueDate: addDays(today, 25) }),
    blank({ kind: "recurring", name: "Filter air", emoji: "💧", category: "Household", lastPurchasedOn: addDays(today, -100), durationDays: 90, periodStart: addDays(today, -100), dueDate: addDays(today, -10) }),

    blank({ kind: "warranty", name: "Laptop kantor", emoji: "🖥️", category: "Electronics", purchasedOn: addDays(today, -400), warrantyMonths: 36, periodStart: addDays(today, -400), dueDate: addMonths(addDays(today, -400), 36) }),
    blank({ kind: "warranty", name: "Headphone", emoji: "🎧", category: "Electronics", purchasedOn: addDays(today, -700), warrantyMonths: 24, periodStart: addDays(today, -700), dueDate: addMonths(addDays(today, -700), 24) }),
    blank({ kind: "warranty", name: "Mesin cuci", emoji: "🌀", category: "Appliances", purchasedOn: addDays(today, -1000), warrantyMonths: 24, periodStart: addDays(today, -1000), dueDate: addMonths(addDays(today, -1000), 24) }),
  ];
}
