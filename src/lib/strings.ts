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
} as const;

export type Strings = typeof strings;
