# Renewly: Tasks

Work strictly in order. Each task: objective, files, tests, manual check. Tick the box only when the Definition of Done in `.kiro/steering/project.md` is met. Split any task that grows past about 300 changed lines.

## Phase 1: Foundations

- [x] **1.1 Memory files and design system**
  - Objective: steering, specs, NOTES.md; clone design reference (git-ignored), run generator, write design system.
  - Files: `.kiro/steering/*`, `docs/design-system.md`, `docs/specs/renewly/*`, `NOTES.md`, `scripts/check-design-tokens.mjs`, `.gitignore`.
  - Tests: `node scripts/check-design-tokens.mjs` (tokens present, AA contrast, both themes).
  - Manual: open `docs/design-system.md`, see commit hash and token block.

- [x] **2.1 Scaffold Next.js, strict TS, lint, Vitest**
  - Objective: pinned-version app that builds. Files: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`.
  - Tests: smoke test. Manual: `npm run dev` shows page.
- [x] **2.2 Tokens, fonts, strings, env example, security headers**
  - Objective: map design tokens to CSS variables and Tailwind theme; IBM Plex Sans via `next/font`; `strings.ts`; `.env.example`; headers in `next.config.ts`; `check:tokens` script.
  - Files: `src/app/globals.css`, `tailwind` config/theme, `src/lib/strings.ts`, `.env.example`, `next.config.ts`.
  - Tests: header unit test; `npm run check:tokens`. Manual: response headers in browser devtools.

## Phase 2: Database

- [x] **3.1 Core schema migration** (profiles, items, purchase_history, indexes, constraints, triggers)
  - Files: `supabase/migrations/0001_core.sql`. Tests: constraint checks in `supabase/tests/schema.sql`. Manual: apply to dev project, inspect tables.
- [x] **3.2 Notifications, reminder_log, push_subscriptions migration**
  - Files: `supabase/migrations/0002_reminders.sql`. Tests: unique-key conflict test.
- [x] **3.3 RLS policies for all tables**
  - Files: `supabase/migrations/0003_rls.sql`. Tests: `supabase/tests/rls.sql` two-user isolation per table.
- [x] **3.4 Storage buckets and policies** (`logos`, `receipts`, size and MIME limits)
  - Files: `supabase/migrations/0004_storage.sql`. Tests: cross-user object access in `rls.sql`.
- [x] **3.5 Test runner and seed**
  - Files: `scripts/run-sql-tests.mjs`, `supabase/seed.sql`, `package.json` script `test:rls`. Manual: run against a throwaway dev project.

## Phase 3: Pure logic (Vitest)

- [x] **4.1 Calendar-date utilities** (`todayIn`, add days/months with clamping, diff) - `src/lib/dates/*`; tests: DST zones, month ends, leap years.
- [x] **4.2 Billing cycles** (`nextBillingAfter`, `previousBilling`) - tests: 29/30/31 monthly, Feb 29 yearly, custom N, weekly.
- [x] **4.3 Ring view-model** (fraction, state, label, aria text) - `src/lib/rings/*`; tests: thresholds 30% and 3 days, overdue, today, paused, tiny totals.
- [x] **4.4 Money** (monthly normalisation, per-currency totals, formatting) - tests: all cycles, mixed currencies, rounding.
- [x] **4.5 Recurring intervals** (average interval, suggestion) - tests: <3 purchases, 10% threshold.
- [x] **4.6 Reminder planner** (which offsets fire today per timezone, skip paused, overdue handling) - `src/lib/reminders/plan.ts`; tests: day boundary, offsets, overdue, duplicates.

## Phase 4: UI shell and ring

- [x] **5.1 Ring component** (SVG, states, aria-label, reduced motion, logo/emoji/initials) - tests: four states + inactive, aria text.
- [x] **5.2 App shell** (header, bottom nav 4 items, safe areas, theme) - manual at 375px.
- [x] **5.3 Gallery page** `/dev/rings` (dev only) for visual review.

## Phase 5: Auth

- [x] **6.1 Supabase clients and middleware** (`@supabase/ssr`, session refresh) - tests: zod env validation.
- [x] **6.2 Sign-in page and callback** (magic link, inline errors) - tests: email schema.
- [x] **6.3 Profile bootstrap and settings** (timezone, currency, default offsets) - tests: settings schema.
- [x] **6.5 Password sign-in** (replaces magic link; `signInWithPassword` server action) - tests: sign-in schema, auth error mapping, sign-in action, sign-in form.

## Phase 6: Sections and items (revised 2026-10-24: five fixed sections, see requirements R12-R14)

Sections (fixed list for now): subscription, reminder, savings (tabungan), recurring purchase, warranty. Each has its own form and its own look.

- [x] **6.4 Migration 0005 for the new sections**
  - Objective: allow kinds `reminder` and `savings`; money columns to bigint with higher caps (IDR amounts); savings fields (`target_minor`, `saved_minor`); nullable `period_start`/`due_date` for savings without a deadline; status `done` for one-off reminders; `savings_entries` table (deposits, withdrawals, adjustments) with a trigger that keeps `saved_minor` in sync; owner-only RLS.
  - Files: `supabase/migrations/0005_sections.sql`, `supabase/tests/04_sections.sql`; adjust earlier SQL tests if constraints changed.
  - Tests: constraints per new kind, trigger arithmetic, never below zero, cross-user isolation on `savings_entries`.
  - Manual: `npm run test:rls:local`.

- [x] **7.1 Item zod schemas and DB mapping for all five kinds** (shared client/server) - tests: each kind, invalid cases, https cancel link, IDR amounts.
- [x] **7.2 Date derivation and server actions** create/update/delete with derived `period_start`/`due_date` - tests: derivation per kind.
- [x] **7.3 Add flow: section picker sheet** (five large options, one-thumb)
- [x] **7.4 Subscription form**
- [x] **7.5 Recurring purchase form**
- [x] **7.6 Warranty form** (expiry computed from length)
- [x] **7.7 Reminder form** (one-off or repeating, "mark done")
- [x] **7.8 Savings goal form** (name, target, starting amount, optional deadline)
- [x] **7.9 Detail pages per section** (time ring for subscription, recurring, warranty, reminder; savings progress card with entry history; edit, pause/resume/cancel, delete confirm)
- [x] **7.10 Savings entries**: deposit, withdraw, correct the total - tests: arithmetic, never below zero, goal reached state.
- [x] **7.11 Savings maths** (pure, `src/lib/savings`) - tests: percent, remaining, monthly need, completed, overdue.

## Phase 7: Dashboard

- [x] **8.1 Query + sort/filter/search logic** (pure) - tests: ordering, filters, search.
- [x] **8.2 Dashboard by section** (section tabs/chips, each section with its own layout: rings for time-based, progress cards for savings, compact rows for reminders), filters in URL, empty states
- [x] **8.3 Upcoming in 30 days + monthly cost summary**
- [ ] **8.4 Performance check with 200 seeded items** (note measurements in NOTES.md)

## Phase 8: Files

- [ ] **9.1 Image validation and resize helpers** (type, size, max 256px, WEBP) - tests with fixtures/mocks.
- [ ] **9.2 Logo upload + signed URL display**
- [ ] **9.3 Receipt upload on warranties**

## Phase 9: Purchases

- [ ] **10.1 "I bought it again" action + history insert** - tests: logic; manual ring reset.
- [ ] **10.2 History list and interval suggestion (accept/dismiss)**
- [ ] **10.3 Subscription renewal marking and roll-forward helper**
- [ ] **10.4 Optional Playwright flow** (sign in, add, mark bought, ring resets)

## Phase 10: Reminders

- [ ] **11.1 Verify scheduler free-tier limits in official docs** (Vercel cron, Supabase pg_cron/Edge Functions) and record decision in NOTES.md.
- [ ] **11.2 Reminder offsets UI** (global default and per item) - tests: schema.
- [ ] **11.3 Edge Function `send-reminders`** using the tested planner, claim-then-send idempotency - tests: planner + idempotency with a fake store.
- [ ] **11.4 pg_cron schedule migration** (secret from Vault, no secret in repo)
- [ ] **11.5 Resend email** (templates in function, no PII in logs)
- [ ] **11.6 Notification centre** (list, unread badge, mark read)
- [ ] **11.7 Web Push (optional)** subscribe/unsubscribe, VAPID, send from function
- [ ] **11.8 Rate-limited manual trigger route** (zod, shared secret) - tests: limiter.

## Phase 11: PWA and finish

- [ ] **12.1 Manifest, icons, service worker, install prompt**
- [ ] **13.1 Pre-delivery checklist run and fixes** (record results in NOTES.md and design-system.md)
- [ ] **13.2 README and Vercel deploy guide** (Supabase setup, migrations, env vars, Resend, scheduling, design source and hash, privacy)
- [ ] **13.3 Final verification** (lint, tests, build, RLS tests) and honest list of unverified items
