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
  auth: {
    signInTitle: "Sign in",
    signInLead: "Enter your email and we will send you a sign-in link. No password needed.",
    emailLabel: "Email address",
    emailHint: "We only use it to sign you in and to send reminders.",
    submit: "Send sign-in link",
    submitting: "Sending...",
    invalidEmail: "Enter a valid email address, like name@example.com.",
    sendFailed: "We could not send the link. Wait a minute and try again.",
    linkFailed: "That sign-in link is invalid or has expired. Request a new one.",
    sentTitle: "Check your inbox",
    sentBody: (email: string) => `We sent a sign-in link to ${email}. Open it on this device to finish signing in.`,
    useDifferentEmail: "Use a different email",
    signOut: "Sign out",
  },
  form: {
    errorSummaryTitle: "Fix these before saving",
    saved: "Saved.",
    saving: "Saving...",
    save: "Save changes",
    saveFailed: "We could not save your changes. Try again.",
  },
  settings: {
    accountHeading: "Account",
    signOut: "Sign out",
    preferencesHeading: "Preferences",
    timezoneLabel: "Time zone",
    timezoneHint: "Due dates and reminders use your local day.",
    timezoneInvalid: "Choose a time zone from the list.",
    currencyLabel: "Default currency",
    currencyHint: "Used for new subscriptions. Totals are never converted between currencies.",
    currencyInvalid: "Choose a currency from the list.",
    remindersHeading: "Reminders",
    remindersLegend: "Remind me before something is due",
    remindersHint: "Pick the days before the due date. Each item can override this.",
    offsetsInvalid: "Pick up to 10 reminder days between 0 and 365.",
    offsetLabel: (days: number) =>
      days === 0 ? "On the due day" : days === 1 ? "1 day before" : `${days} days before`,
    emailLabel: "Send reminders by email",
    emailHint: "In-app notifications are always on.",
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
