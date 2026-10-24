# Renewly: Requirements

Format: user story, then acceptance criteria as "WHEN <situation> THE SYSTEM SHALL <behaviour>".
Out of scope for v1: bank or email syncing, automatic currency conversion, sharing items, native apps, Google sign-in, favicon fetching.

## R1 Sign in
As a user I sign in with an email magic link so I need no password.
- WHEN I submit a valid email THE SYSTEM SHALL send a magic link and show a "check your inbox" message.
- WHEN I submit an invalid email THE SYSTEM SHALL show an inline error next to the field and not call Supabase.
- WHEN I open the magic link THE SYSTEM SHALL create a session and redirect me to the dashboard.
- WHEN I am signed out and open a protected route THE SYSTEM SHALL redirect me to the sign-in page.
- WHEN I sign in for the first time THE SYSTEM SHALL create my profile with the browser timezone, default currency and default reminder offsets 7, 3, 1 and 0.

## R2 Add and manage items
As a user I add subscriptions, recurring purchases and warranties with one thumb.
- WHEN I tap Add THE SYSTEM SHALL offer the three kinds as large (44px or more) options in a bottom sheet.
- WHEN I save a subscription THE SYSTEM SHALL require name, price, currency, billing cycle (weekly, monthly, yearly or custom every N days, N from 1 to 3650) and next billing date, and store category, payment method, auto-renew, notes and an optional cancel link (https only).
- WHEN I save a recurring purchase THE SYSTEM SHALL require name, last purchased date and estimated duration in days, and store optional usual price, store and quantity.
- WHEN I save a warranty THE SYSTEM SHALL require product name, purchase date and warranty length, compute the expiry date, and store an optional serial number and receipt photo.
- WHEN any field fails validation THE SYSTEM SHALL keep my input, show inline errors with a linked error summary, and not save.
- WHEN I edit an item THE SYSTEM SHALL revalidate with the same zod schema on client and server and recompute its ring dates.
- WHEN I pause an item THE SYSTEM SHALL keep it, show a Paused state without urgency colours, and send no reminders for it.
- WHEN I cancel a subscription THE SYSTEM SHALL mark it cancelled, exclude it from monthly cost and send no reminders.
- WHEN I delete an item THE SYSTEM SHALL ask for confirmation naming the item, and on confirm delete the item, its history, and its stored files.

## R3 Rings
As a user I see time remaining as a ring with a logo and text.
- WHEN an item has more than 30% of its period left THE SYSTEM SHALL show the comfortable state.
- WHEN an item has 30% or less left THE SYSTEM SHALL show the soon state.
- WHEN an item has 3 or fewer days left THE SYSTEM SHALL show the urgent state (overrides soon).
- WHEN the due date is past THE SYSTEM SHALL show the overdue state (overrides all) with text "Overdue by N days".
- WHEN the due date is today THE SYSTEM SHALL show "Due today" (warranties: "Expires today"); WHEN one day remains "1 day left"; WHEN a warranty has expired "Expired N days ago".
- WHEN an item is paused or cancelled THE SYSTEM SHALL show "Paused" or "Cancelled" with no urgency state.
- WHEN a ring is displayed THE SYSTEM SHALL always show text and a state glyph in addition to colour, and set an `aria-label` describing name, time left and state.
- WHEN prefers-reduced-motion is set THE SYSTEM SHALL render the final ring state with no animation.
- WHEN an item has no logo THE SYSTEM SHALL show the chosen emoji, otherwise up to two initials.

## R4 Dashboard
As a user I see everything that needs attention first.
- WHEN I open the dashboard THE SYSTEM SHALL list rings sorted by urgency (overdue, then least time left; paused and cancelled last).
- WHEN I filter by kind or category or type a search THE SYSTEM SHALL update the grid without a page reload and keep the filter in the URL.
- WHEN items are due within 30 days THE SYSTEM SHALL list them in "Upcoming in 30 days" ordered by date.
- WHEN I have active subscriptions THE SYSTEM SHALL show the monthly cost, normalising weekly (x52/12), yearly (/12) and custom N-day (x30.4375/N) cycles, with one total per currency and no conversion.
- WHEN I have no items THE SYSTEM SHALL show a friendly empty state with a primary Add action.
- WHEN I have 200 items THE SYSTEM SHALL render the dashboard with no horizontal scroll and no long main-thread task over 200 ms in a production build (measured manually).

## R5 Item detail
- WHEN I open an item THE SYSTEM SHALL show a large ring, key fields, and its purchase or renewal history newest first.
- WHEN I use edit, pause, resume, cancel or delete THE SYSTEM SHALL provide keyboard-accessible controls and confirm destructive ones.

## R6 Recurring purchases
- WHEN I tap "I bought it again" THE SYSTEM SHALL set last purchased to today in my timezone, append a purchase_history row (date, price, store, quantity, prefilled from usual values), reset the ring, and announce it via an aria-live region.
- WHEN an item has 3 or more purchases THE SYSTEM SHALL compute the average real interval and suggest updating the estimated duration when it differs by 10% or more, and SHALL NOT change the estimate unless I accept.

## R7 Subscriptions renewal
- WHEN an active auto-renew subscription passes its billing date THE SYSTEM SHALL roll the next billing date forward by whole cycles and record a renewal in history (once per cycle).
- WHEN a subscription is not auto-renew and passes its date THE SYSTEM SHALL keep it overdue until I mark it renewed or cancelled.
- WHEN billing is monthly and the day does not exist in a month THE SYSTEM SHALL use that month's last day without drifting the anchor day (31st -> Feb 28/29 -> Mar 31).
- WHEN billing is yearly on Feb 29 THE SYSTEM SHALL use Feb 28 in non-leap years and Feb 29 in leap years.

## R8 Logos and receipts
- WHEN I choose a PNG, JPG or WEBP logo THE SYSTEM SHALL validate type and size client-side (reject over 5 MB source), resize to at most 256 px, re-encode to WEBP and upload to my folder in the private `logos` bucket.
- WHEN a file has another type THE SYSTEM SHALL reject it with an inline message; AND the bucket SHALL reject it server-side by MIME type and 512 KB size limit.
- WHEN I view an item with a logo or receipt THE SYSTEM SHALL use short-lived signed URLs.
- THE SYSTEM SHALL NOT fetch arbitrary URLs on the server.

## R9 Reminders
- WHEN an item is active and its due date minus an offset equals today in my timezone THE SYSTEM SHALL create one in-app notification and, if enabled, one email and one push, per offset.
- WHEN a reminder was already sent for (item, due date, offset, channel) THE SYSTEM SHALL NOT send it again, including after retries or restarts.
- WHEN an item has its own offsets THE SYSTEM SHALL use them; otherwise my global default (initially 7, 3, 1, 0).
- WHEN an item is paused or cancelled THE SYSTEM SHALL send nothing.
- WHEN an item is overdue and nothing was sent for its past due date THE SYSTEM SHALL NOT send back-dated reminders for offsets in the past, except one "overdue" notification per due date.
- WHEN I change the due date THE SYSTEM SHALL schedule new reminders for the new date (the log is keyed by due date).
- WHEN I open the notification centre THE SYSTEM SHALL list notifications newest first, with unread count and mark-read.
- WHEN Web Push is enabled and the PWA is installed THE SYSTEM SHALL deliver push through the service worker; push is optional.

## R10 Security and privacy
- WHEN any request reads or writes data THE SYSTEM SHALL enforce RLS so that user A can never read or modify user B's rows or files.
- THE SYSTEM SHALL keep the service-role key server-side only and out of the repo.
- WHEN a custom API route is called THE SYSTEM SHALL validate input with zod and apply a rate limit.
- THE SYSTEM SHALL send CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and frame-ancestors headers.
- THE SYSTEM SHALL NOT log secrets or personal data.

## R11 PWA and accessibility
- WHEN I open the site on a phone THE SYSTEM SHALL be installable (manifest, icons, service worker).
- THE SYSTEM SHALL meet WCAG AA contrast, show visible focus, never convey status by colour alone, and support reduced motion and keyboard use.
- THE SYSTEM SHALL keep all UI strings in `src/lib/strings.ts`.

## R12 Sections (added 2026-10-24)
As a user I organise what I track into a fixed set of sections, each with its own form and look.
- THE SYSTEM SHALL offer these sections: Subscriptions, Reminders, Savings (tabungan), Recurring purchases and Warranties. The list is fixed for now (not user-defined).
- WHEN I tap Add THE SYSTEM SHALL show the sections as large (44px or more) options and open the form for the one I pick.
- WHEN I open the dashboard THE SYSTEM SHALL group items by section, let me filter to one section, and render each section in its own style: rings for time-based items, progress cards for savings, compact rows for reminders.
- THE SYSTEM SHALL keep section-specific fields validated by one shared zod schema per section.

## R13 Savings goals (tabungan)
As a user I set a savings goal and record how much I have saved so far.
- WHEN I create a goal THE SYSTEM SHALL require a name, a target amount above 0 and a currency, and accept a starting amount (default 0), an optional target date, an emoji and notes.
- WHEN I add a deposit THE SYSTEM SHALL increase the saved total, record the entry (date, amount, note) and update the progress immediately.
- WHEN I withdraw THE SYSTEM SHALL decrease the total, but SHALL NOT allow it to go below 0.
- WHEN I correct the total THE SYSTEM SHALL record the difference as an adjustment entry so history stays consistent.
- THE SYSTEM SHALL show progress as saved, target, percent (not colour alone), the amount still needed and, with a target date, the amount needed per month.
- WHEN the saved total reaches the target THE SYSTEM SHALL show a completed state with text, and send no further reminders for the goal.
- WHEN a goal has a target date THE SYSTEM SHALL remind me before it using the usual offsets.
- THE SYSTEM SHALL store amounts in the currency's minor units as 64-bit integers (large amounts such as tens of millions of rupiah fit) and show Indonesian rupiah without decimals.

## R14 Reminders (general)
As a user I keep simple dated reminders that are not tied to a purchase.
- WHEN I create a reminder THE SYSTEM SHALL require a title and a date, and accept notes and an optional repeat (weekly, monthly, yearly or every N days).
- WHEN a reminder is repeating and I mark it done THE SYSTEM SHALL move it to the next occurrence (month-end and leap-day rules as for billing).
- WHEN a one-off reminder is marked done THE SYSTEM SHALL mark it done, show it as completed and send no further reminders.
- WHEN a reminder is overdue THE SYSTEM SHALL show it as overdue with text until I mark it done or change its date.
