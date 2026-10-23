# Renewly: project rules (always included)

## Session start
Read this file, `NOTES.md` and `docs/specs/renewly/tasks.md` first. Work on the first unticked task only.

## Product
Renewly is a personal, mobile-first PWA that tracks (1) subscriptions, (2) recurring purchases and (3) warranties. Every item is a circular SVG progress ring with its logo inside, showing time left until the next renewal, next purchase or warranty expiry. It sends reminders before things are due (in-app, email via Resend, optional Web Push).

## Stack
Next.js App Router, TypeScript strict, Tailwind (design tokens only), Supabase (Auth magic link, Postgres + RLS, Storage, pg_cron + Edge Functions), Vercel hosting, Vitest, zod. No separate backend server.

## Commands
- Install: `npm ci` (first time `npm install`, then commit the lockfile)
- Dev server: `npm run dev` (run manually, never in a blocking tool call)
- Lint: `npm run lint`
- Unit tests: `npm test` (Vitest, single run)
- Production build: `npm run build`
- Design token check: `npm run check:tokens`
- Apply migrations: `npx supabase link --project-ref <ref>` once, then `npx supabase db push`
- SQL/RLS tests: `npm run test:rls` (needs `SUPABASE_DB_URL` for a throwaway dev project in your shell; see README)

## Layout
- `src/app/` routes (App Router); route-only components in `_components/`
- `src/lib/` pure logic (dates, rings, reminders, money), Supabase clients, zod schemas
- `src/lib/strings.ts` ALL user-facing UI strings
- `src/components/` shared UI primitives
- `supabase/migrations/` versioned SQL; `supabase/functions/` Edge Functions; `supabase/tests/` SQL tests; `supabase/seed.sql`
- `docs/` design system and specs; `design-reference/` is git-ignored third-party clone

## Conventions
- Files kebab-case, components PascalCase, functions camelCase, SQL snake_case.
- Server Components by default; `'use client'` only on interactive leaves.
- Every input (form, server action, route handler, Edge Function payload) is validated with zod; share schemas between client and server.
- UI uses ONLY the design tokens from `docs/design-system.md` (CSS variables / Tailwind theme). No raw hex, no ad-hoc spacing, no emoji as icons.
- All UI strings come from `src/lib/strings.ts`.
- Pure date logic takes an explicit IANA timezone and a `now` argument; no hidden `Date.now()`.
- Never log secrets or personal data.

## Hard rules
- Never read, print or commit `.env*` files. `.env.example` holds names only.
- The Supabase service-role key never reaches the browser or the repo. Only intended `NEXT_PUBLIC_` vars are public.
- Pin dependency versions exactly (no `^` or `~`).
- No force push, no `--amend` of shared history, no `--no-verify`. Do not push to a remote unless asked. Stage files by name, never `git add .`.
- Ask before any destructive or irreversible action: dropping data, bulk file deletion, changing auth or RLS policies.
- Shell commands get a timeout; check logs before waiting again; run long builds in the background.

## Definition of done (per task)
Tests pass, `npm run build` passes, lint is clean, RLS is checked for any new table or policy, `NOTES.md` updated, checkbox ticked in `tasks.md`, committed with a conventional message.
