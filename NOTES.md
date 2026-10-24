# NOTES (living log, keep under ~200 lines)

## Status
- Done: git repo initialised; design reference cloned (git-ignored); design system generated and written; token contrast script passes; steering and spec files written.
- Tasks 1.1, 2.1, 2.2, 3.1-3.5, 4.1-4.6 complete (committed locally). Pure logic in `src/lib/{dates,rings,money,purchases,reminders}`: 117 unit tests pass, lint and build clean. lint, 5 unit tests, `next build` pass; response headers (CSP, nosniff, HSTS, frame deny) checked against `next start`.
- Schema, RLS, storage policies and seed: 100 SQL assertions pass on embedded Postgres (PGlite) via `npm run test:rls:local`. A deliberately broken policy is caught by the tests.
- Tasks 5.1-5.3 complete: `Ring`/`RingCard` (`src/components/ring/ring.tsx`), app shell with 4-item bottom nav (`src/components/shell`), route group `src/app/(app)` with placeholder Add/Alerts/Settings pages, dev-only gallery at `/dev/rings` (404 in production). 18 component/helper tests added. Server-rendered HTML of the gallery, home and settings checked against `next dev` (all state labels, aria-labels, aria-current present).
- Tasks 6.1-6.3 complete: Supabase clients (`src/lib/supabase`), `src/proxy.ts` (Next 16 name for middleware) refreshes the session with `getClaims()` and redirects signed-out users; fails closed (503) when Supabase env is missing, except `/dev/*` in development. Magic-link sign-in page, `/auth/callback` (PKCE code) and `/auth/confirm` (token hash, works across browsers), settings page (time zone, currency, reminder days, email toggle, sign out), device time zone auto-detected once while the profile is still "UTC". 173 unit tests pass; lint and build clean.
- Verified against `next dev` with placeholder env: 503 without env, `/` and `/settings` redirect to `/sign-in?next=...`, `/sign-in` renders the form, bad callback/confirm params redirect to `/sign-in?error=link`.
- Next: 7.1 item zod schemas and DB mapping.

## Decisions
- 2026-10-24: SCOPE CHANGE from the user: the app is not only subscriptions. Fixed sections for now: Subscriptions, Reminders, Savings (tabungan: goal with target, user records how much saved) and, kept from the original brief, Recurring purchases and Warranties. Each section has its own form and visual style (rings for time-based items, wallet-style progress card for savings, compact rows for reminders). Assumption: recurring purchases and warranties STAY; ask the user if they want them removed. Specs updated (R12-R14, design.md "Sections", tasks 6.4 and 7.x). Reason: the data model differs per section. Rejected: one generic ring for everything.
- 2026-10-24: Amounts use bigint minor units, IDR treated as 0-decimal. Reason: 50 juta at 2 decimals overflows int32.
- 2026-10-23: Style = Minimalism & Swiss, IBM Plex Sans, navy/gold palette. Reason: second generator query (narrower) fit dashboards and has low a11y risk; the first query returned Glassmorphism with a landing-page pattern. Rejected: Glassmorphism/Fira (blur hurts contrast, not a fit for dense ring grid).
- 2026-10-23: shadcn/ui not used. Reason: generator did not recommend it for this product. Plain Tailwind + tokens.
- 2026-10-23: Ran the generator Python scripts directly, not the `npx ui-ux-pro-max-cli`. Reason: stdlib-only, skimmed, no network; no need to install a skill.
- 2026-10-23: Persist `period_start` and `due_date` on items. Reason: scheduler and indexes query by date. Rejected: compute only in app.
- 2026-10-23: reminder_log and notifications are written only by the service role. Reason: clients must not forge or erase the idempotency log.
- 2026-10-23: Email via Resend; without a verified domain it only delivers to the account owner's address.
- 2026-10-23: Hosted Supabase dev project for SQL/RLS tests (no Docker); local Supabase documented as alternative.
- 2026-10-24: SQL tests also run locally on PGlite (real Postgres in WASM) with small Supabase stubs, so RLS is verifiable with no account or Docker. Rejected: Docker-only `supabase start`.
- 2026-10-24: purchase_history and reminder_log use a composite FK (item_id, user_id) to items(id, user_id), so a child row can never point at another user's item.
- 2026-10-24: Reminder planner sends from local hour 8 onward (not only during hour 8), no back-filled offsets, one overdue notice within 30 days of the due date. Reason: tolerate late or retried runs; the reminder_log key prevents duplicates.
- 2026-10-24: `price_cents` columns hold the currency's minor units (JPY has 0 decimals), via `minorUnitDigits`.
- 2026-10-24: Next 16 `proxy.ts` instead of `middleware.ts`; auth check uses `getClaims()` (verifies the token signature) rather than trusting the cookie. Both PKCE `/auth/callback` and token-hash `/auth/confirm` are provided because email apps on phones often open links in another browser.
- 2026-10-24: App routes are `force-dynamic` (per-user data must not be cached).
- 2026-10-24: Migrations use numeric prefixes (0001_...) instead of timestamps.
- 2026-10-23: Scheduler = Supabase pg_cron + Edge Function (tentative). Limits to be verified in task 11.1.

## Assumptions and open questions
- Python 3.12, Node 24, npm 11, git 2.47 present on this machine.
- A Supabase project URL, anon key and DB URL are needed from the user before applying migrations (task 3.5). Until then migrations and tests are written but not applied.
- Dark theme values are derived by me (generator emitted only light for the chosen style).

## Known issues and NOT verified
- TypeScript is pinned to 6.0.3, not 7.0.2: typescript-eslint (via eslint-config-next) throws on TS 7. Revisit when it supports 7.1+.
- Vitest 5 / rolldown: npm skipped the Windows native binding. Fixed by listing `@rolldown/binding-win32-x64-msvc@1.2.15` in optionalDependencies (npm installs it only on Windows x64). Not yet checked with a clean `npm ci`.
- NOT verified: migrations and tests against a real hosted Supabase project (no project or credentials yet). The local run uses stubs for auth, storage and roles (`supabase/tests/support/local-stubs.sql`), so platform differences (required columns on auth.users, storage triggers) could still show up on the first `npx supabase db push` and `npm run test:rls`.
- An expired warranty is shown in the overdue state; its wording ("Expired N days ago") is handled in task 4.3.
- npm warns EBADENGINE: some dev dependency wants Node ^24.15 or ^22.22.2, this machine has 24.7.0. Tests and build work; upgrading Node removes the warning.
- CSP uses `'unsafe-inline'` for scripts and styles (static pages, no nonce yet). A nonce-based CSP via middleware is a possible hardening step.
- `.kiro/settings/` (local permissions) is git-ignored.
- NOT verified: the real sign-in round trip (email delivery, magic link, session cookies, profile read/write, sign out, timezone auto-detect) because there is no Supabase project yet. The Supabase "Magic Link" email template must link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` for phone-friendly sign-in; Site URL and redirect URLs must include your Vercel domain and `http://localhost:3000/**`. To be written up in the README (task 13.2).
- Sign-up is open to any email by default; for a purely personal deployment, turn off "Allow new users to sign up" in Supabase Auth after creating your account.
- NOT verified visually: I have no browser here, so layout, colours, the ring fill animation, safe-area padding, focus outlines and the 375px/dark-mode appearance have not been seen. Only the rendered HTML and unit/component tests were checked. Open `/dev/rings` on your phone or in devtools device mode and tell me what looks off.
- Placeholder pages (/add, /alerts, /settings) are filled in by tasks 6.3, 7.x and 11.6; the shell has no auth guard until task 6.1/6.2.

## How to resume
1. Read `.kiro/steering/project.md`, this file, `docs/specs/renewly/tasks.md`.
2. `git log --oneline` and `git status` to see where you are.
3. Run `node scripts/check-design-tokens.mjs`; after task 2.1 use `npm test`, `npm run lint`, `npm run build`.
4. Continue with the first unticked task in tasks.md.
