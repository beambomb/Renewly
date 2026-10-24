# Renewly: Design

## Architecture

```
Phone PWA (Next.js on Vercel)
  |-- Supabase Auth (magic link) ----------------------> cookies via @supabase/ssr
  |-- Server Components / server actions (zod) --------> Postgres (RLS as the user)
  |-- Browser: logo/receipt upload (resized) ----------> Storage (private buckets, per-user folders)
pg_cron (daily + hourly tick) --> pg_net --> Edge Function `send-reminders` (service role, server-only)
  |-- reads due items, writes reminder_log + notifications, sends Resend email and Web Push
```

- No separate backend. The only privileged code is the Edge Function; its secrets live in Supabase function secrets.
- Browser and server actions use the anon key plus the user's session, so RLS always applies.
- The scheduler choice (pg_cron + Edge Function vs Vercel cron) is confirmed against official docs in task 11.1 and recorded in NOTES.md.

## Data model (all tables: `user_id uuid not null default auth.uid()` + RLS)

profiles (PK user_id references auth.users on delete cascade)
- timezone text (IANA, default 'UTC'), default_currency char(3), reminder_offsets int[] default {7,3,1,0}, email_enabled bool, push_enabled bool, created_at, updated_at.

items (one table, `kind` in subscription | recurring | warranty)
- common: id, user_id, kind, name (1-80), category (<=40), notes (<=2000), emoji (<=8), logo_path, status (active | paused | cancelled), reminder_offsets int[] null (null = profile default), period_start date, due_date date, created_at, updated_at.
- subscription: price_cents int >= 0, currency char(3), billing_cycle (weekly | monthly | yearly | custom), cycle_days int (custom only), billing_anchor_day smallint (1-31, monthly/yearly anchor to avoid drift), payment_method text, auto_renew bool, cancel_url text (https).
- recurring: last_purchased_on date, duration_days int > 0, usual_price_cents, usual_currency, usual_store, usual_quantity numeric.
- warranty: purchased_on date, warranty_months int > 0, expires_on date, serial_number, receipt_path.
- `period_start` and `due_date` are persisted (derived by the pure TS logic in `src/lib/rings`) so the scheduler and indexes can query by date. A CHECK ties them to the kind (`due_date >= period_start`, kind-specific columns not null).
- Indexes: `(user_id)`, `(user_id, due_date)`, partial `(due_date) where status = 'active'` for the scheduler.

purchase_history (id, user_id, item_id fk on delete cascade, event ('purchase' | 'renewal'), occurred_on date, price_cents, currency, store, quantity, created_at). Index `(item_id, occurred_on desc)` and `(user_id)`.

reminder_log (id, user_id, item_id fk cascade, due_date date, offset_days int, channel ('in_app' | 'email' | 'push'), status ('claimed' | 'sent' | 'failed'), created_at, UNIQUE (item_id, due_date, offset_days, channel)).

notifications (id, user_id, item_id fk set null, title, body, created_at, read_at).

push_subscriptions (id, user_id, endpoint unique, p256dh, auth, created_at). Needed for Web Push.

## RLS policies

- profiles, items, purchase_history, push_subscriptions: separate select / insert / update / delete policies, each `using (user_id = auth.uid())`; insert and update use `with check (user_id = auth.uid())`. Also a trigger forbids changing `user_id` on update.
- purchase_history insert/update additionally require the parent item to belong to the user (`exists` on items) so history cannot be attached to someone else's item.
- reminder_log: owner select only. Writes come only from the Edge Function with the service role. (Deliberate deviation from "all four policies": giving clients write access would let them forge or erase the idempotency log.)
- notifications: owner select, update (mark read) and delete; inserts only by the Edge Function.
- Storage: private buckets `logos` (512 KB, png/jpeg/webp) and `receipts` (3 MB, png/jpeg/webp). Object path `<user_id>/<uuid>.<ext>`; policies on `storage.objects` allow select/insert/update/delete only when `bucket_id` matches and `(storage.foldername(name))[1] = auth.uid()::text`.
- Profile row is created by an `after insert on auth.users` trigger (security definer, fixed search_path).
- The SQL tests (`supabase/tests/rls.sql`) create two users, act as each via `set local role authenticated` and `request.jwt.claims`, and assert zero cross-user visibility and failed writes on every table and bucket.

## Ring-percentage logic (`src/lib/rings`)

All dates are calendar dates (`YYYY-MM-DD`) in the user's IANA timezone; "today" = `todayIn(tz, now)`.
- total = days(period_start -> due_date), min 1. left = days(today -> due_date) (negative when overdue).
- fraction_left = clamp(left / total, 0, 1); ring fill = fraction_left; elapsed = 1 - fraction_left.
- Recurring: period_start = last_purchased_on, due = + duration_days. Warranty: period_start = purchased_on, due = expires_on. Subscription: period_start = previous billing date, due = next billing date.
- State: paused/cancelled -> `inactive`; left < 0 -> `overdue`; left <= 3 -> `urgent`; fraction_left <= 0.30 -> `soon`; else `comfortable`. Urgent is checked before soon.
- Labels: left > 1 "N days left", 1 "1 day left", 0 "Due today", < 0 "Overdue by N day(s)". Strings come from `strings.ts`.
- Day differences use UTC-midnight arithmetic on calendar dates, so daylight-saving shifts cannot produce 23 or 25 hour errors. Only converting an instant to a local calendar date uses the timezone (`Intl.DateTimeFormat`).

## Billing date maths

- weekly: +7 days. custom: +N days. monthly: add months from the anchor day, clamp to month length (31 -> Feb 28/29 -> Mar 31, anchor kept so it does not drift). yearly: same month/day, Feb 29 -> Feb 28 in non-leap years.
- `nextBillingAfter(item, today)` rolls forward by whole cycles until the date is >= today. `previous` is the date one cycle earlier (for period_start).
- Monthly cost: weekly x 52/12, yearly / 12, custom x (365.25/12)/N, monthly as is; amounts stay in integer minor units until display; totals grouped by currency; only active subscriptions.
- Recurring estimate suggestion: with >= 3 purchases, intervals between consecutive dates, mean rounded; suggest if |mean - estimate| / estimate >= 10%.

## Reminder scheduling and idempotency

1. The Edge Function runs hourly (pg_cron). For each user whose local hour is 08:00 or later (so a late or retried run the same day still catches up; the log prevents duplicates), it plans reminders with `planReminders` (`src/lib/reminders/plan.ts`). Offsets in the past are never back-filled. The overdue notice is only sent within 30 days of the due date.
2. For each (item, offset in effective offsets) where `due_date - offset = local_today`: for each enabled channel, `insert into reminder_log (..., status 'claimed') on conflict do nothing returning id`. Only if a row was returned does it send.
3. After a successful send the row becomes `sent`; on a definite provider failure it becomes `failed`, and failed rows are retried at most 3 times by updating them back to `claimed` with a retry counter (kept in the same unique key, so no duplicates). A crash between claim and send leaves `claimed`: such rows are not auto-resent after a timeout (at-most-once is preferred over duplicate email) and are surfaced in function logs by count only.
4. In-app notification rows are created in the same transaction as the `in_app` claim.
5. Overdue: one extra "overdue" notification per (item, due_date) with offset_days = -1.
6. Subscription roll-forward (R7) runs in the same function before reminders, idempotent because it only acts when `due_date < local_today`.
7. All inputs and the payload of the optional manual-trigger route are zod-validated; the route is rate-limited and requires a shared secret header.

## Edge cases covered by tests

Monthly on 29/30/31, yearly Feb 29 (leap and non-leap, multi-year), DST transitions (America/New_York, Europe/Berlin, Pacific/Auckland, Australia/Lord_Howe 30-minute shift), custom N-day cycles including N=1, paused and cancelled items, already-overdue items (no back-dated reminders), user timezone ahead of or behind UTC at the day boundary, offset 0 (due day), duplicate scheduler runs.

## Frontend structure

`src/app/(app)/` authenticated shell with bottom nav (Home, Add, Alerts, Settings), `src/app/(auth)/sign-in`, `src/app/auth/callback`. Ring is a client component with a server-computed view model (no date maths in the browser render path).

## Security headers and CSP

Set in `next.config`: CSP (default-src 'self'; img-src 'self' data: blob: <supabase host>; connect-src 'self' <supabase host>; style-src 'self' 'unsafe-inline' only if required by Next; frame-ancestors 'none'), X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy, HSTS in production.

## Sections (added 2026-10-24)

`items.kind` becomes one of `subscription | reminder | savings | recurring | warranty` (migration 0005). Section registry in code (`src/lib/items/sections.ts`) maps each kind to its label, icon, form fields, dashboard layout and which date fields drive its ring.

| Section | Drives | Ring / visual | Notes |
| --- | --- | --- | --- |
| Subscription | next billing date | time-left ring + price | monthly cost summary |
| Recurring purchase | last purchase + duration | time-left ring | "I bought it again" |
| Warranty | expiry date | time-left ring | receipt upload |
| Reminder | date, optional repeat | compact row with small ring and a "done" action | reuses billing cycle maths for repeats; status `done` for one-offs |
| Savings (tabungan) | saved / target | wallet-style progress card: amount, bar, percent text, remaining, monthly need | deadline optional; reminders only with a deadline |

### Data changes (0005)
- `status` gains `done` (one-off reminders). `kind` check gains `reminder`, `savings`.
- Money columns that hold minor units move to `bigint` with higher caps so IDR amounts fit (50 juta = 5,000,000,000 minor units at 2 digits exceeds int32). The app treats IDR as 0-decimal (override in `minorUnitDigits`), so minor units equal rupiah.
- Savings columns on `items`: `target_minor bigint`, `saved_minor bigint default 0`, `currency` reused. `period_start`/`due_date` become nullable only for savings without a deadline (check: other kinds still require both).
- `savings_entries (id, user_id, item_id, amount_minor bigint, kind deposit|withdrawal|adjustment, occurred_on date, note, created_at)` with composite FK `(item_id, user_id)` like the other child tables. A trigger keeps `items.saved_minor = sum(entries)`; a check keeps the sum at 0 or more. Owner-only RLS (select/insert/delete; no update, entries are immutable, corrections are new entries).
- Reminders reuse `billing_cycle`, `cycle_days`, `billing_anchor_day` for repeats; `billing_cycle` is null for a one-off. A reminder has no price.

### Savings maths (pure, `src/lib/savings`)
- fraction = clamp(saved / target, 0, 1); percent = floor for display so 99.9% never reads as 100%.
- remaining = max(target - saved, 0). With a deadline: months left = max(1, ceil(days / 30.4375)); needed per month = ceil(remaining / months left). Completed when saved >= target. Overdue when a deadline passed and not completed.
- Withdrawals are rejected if they would make the total negative.
