/**
 * All user-facing UI strings live here so the app can be translated later.
 * Functions are used where a string needs interpolation or pluralisation.
 */
export const strings = {
  app: {
    name: "Renewly",
    tagline: "Know what you pay for, what you need to rebuy, and what is still covered.",
    description:
      "Track subscriptions, recurring purchases and warranties as progress rings, with reminders before anything is due.",
  },
  home: {
    heading: "Your rings",
    lead: "Every item shows how much time is left until the next renewal, purchase or expiry.",
  },
  nav: {
    home: "Home",
    add: "Add",
    alerts: "Alerts",
    settings: "Settings",
    primaryLabel: "Primary",
  },
  a11y: {
    skipToContent: "Skip to content",
  },
  dev: {
    ringsTitle: "Ring gallery",
    ringsLead: "Development only. Every ring state, kind and logo variant on a fixed date (24 Oct 2026).",
    sizes: "Sizes",
    detail: "Detail size",
    card: "Card size",
  },
  pages: {
    addTitle: "Add an item",
    addLead: "Choose what you want to keep track of.",
    alertsTitle: "Alerts",
    alertsEmpty: "No alerts yet. Reminders will show up here before something is due.",
    settingsTitle: "Settings",
    settingsLead: "Time zone, currency and reminder defaults.",
  },
  ring: {
    daysLeft: (n: number) => `${n} days left`,
    oneDayLeft: "1 day left",
    dueToday: "Due today",
    overdueBy: (n: number) => (n === 1 ? "Overdue by 1 day" : `Overdue by ${n} days`),
    expiresToday: "Expires today",
    expiredAgo: (n: number) => (n === 1 ? "Expired 1 day ago" : `Expired ${n} days ago`),
    paused: "Paused",
    cancelled: "Cancelled",
    state: {
      comfortable: "On track",
      soon: "Coming up",
      urgent: "Urgent",
      overdue: "Overdue",
      inactive: "Inactive",
    },
    aria: (name: string, label: string, percentLeft: number, state: string) =>
      `${name}, ${label}, ${percentLeft} percent of the period left, status: ${state}`,
    ariaInactive: (name: string, label: string) => `${name}, ${label}`,
  },
} as const;

export type Strings = typeof strings;
