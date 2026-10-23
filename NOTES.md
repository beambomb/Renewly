# NOTES (living log, keep under ~200 lines)

## Status
- Done: git repo initialised; design reference cloned (git-ignored); design system generated and written; token contrast script passes; steering and spec files written.
- Task 1.1 complete (committed locally).
- Next: 2.1 scaffold Next.js app.

## Decisions
- 2026-10-23: Style = Minimalism & Swiss, IBM Plex Sans, navy/gold palette. Reason: second generator query (narrower) fit dashboards and has low a11y risk; the first query returned Glassmorphism with a landing-page pattern. Rejected: Glassmorphism/Fira (blur hurts contrast, not a fit for dense ring grid).
- 2026-10-23: shadcn/ui not used. Reason: generator did not recommend it for this product. Plain Tailwind + tokens.
- 2026-10-23: Ran the generator Python scripts directly, not the `npx ui-ux-pro-max-cli`. Reason: stdlib-only, skimmed, no network; no need to install a skill.
- 2026-10-23: Persist `period_start` and `due_date` on items. Reason: scheduler and indexes query by date. Rejected: compute only in app.
- 2026-10-23: reminder_log and notifications are written only by the service role. Reason: clients must not forge or erase the idempotency log.
- 2026-10-23: Email via Resend; without a verified domain it only delivers to the account owner's address.
- 2026-10-23: Hosted Supabase dev project for SQL/RLS tests (no Docker); local Supabase documented as alternative.
- 2026-10-23: Scheduler = Supabase pg_cron + Edge Function (tentative). Limits to be verified in task 11.1.

## Assumptions and open questions
- Python 3.12, Node 24, npm 11, git 2.47 present on this machine.
- A Supabase project URL, anon key and DB URL are needed from the user before applying migrations (task 3.5). Until then migrations and tests are written but not applied.
- Dark theme values are derived by me (generator emitted only light for the chosen style).

## Known issues and NOT verified
- Nothing runtime-verified yet beyond the token contrast check.

## How to resume
1. Read `.kiro/steering/project.md`, this file, `docs/specs/renewly/tasks.md`.
2. `git log --oneline` and `git status` to see where you are.
3. Run `node scripts/check-design-tokens.mjs`; after task 2.1 use `npm test`, `npm run lint`, `npm run build`.
4. Continue with the first unticked task in tasks.md.
