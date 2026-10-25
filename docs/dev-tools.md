# Dev tools

Helpers for working on Renewly. None of this is part of the product users see. Run everything from the repo root.

## Dev routes

Pages under `src/app/(app)/dev/`. In development they need no sign-in and save nothing.

| Route | What it shows |
| --- | --- |
| `/dev/add` | The Add page (section picker) |
| `/dev/form/[kind]` | The create form for one section. `kind` is one of `subscription`, `reminder`, `savings`, `recurring`, `warranty`; anything else is a 404 |
| `/dev/preview` | The real dashboard with demo data from all five sections |
| `/dev/rings` | Gallery of ring states |

In production each page calls `notFound()` and the proxy sends signed-out users to sign-in, so they are not reachable. They are still compiled into the server build, so the code ships even though the routes do not respond.

## Screenshots and probes

Scripts in `scripts/dev/`. They expect `npm run dev` on `http://localhost:3000`. Screenshot scripts need Chrome or Edge in the default Windows install path and write to `.screens/` (git-ignored). Keep images at 2000px or less per side.

```
node scripts/dev/screenshot.mjs <path> <name> [width] [height] [full]
node scripts/dev/screenshot-device.mjs <path> <name> [width] [height] [full] [scrollY]
node scripts/dev/screenshot-landing.mjs <prefix> <width> <height> [reduce] <shot>...
node scripts/dev/probe-page.mjs <url> <needle> [<needle> ...]
node scripts/dev/probe-status.mjs <url> [expectedStatus] [expectedLocationPrefix]
node scripts/dev/tick-tasks.mjs <id> [<id> ...]
```

- `screenshot.mjs`: plain headless window. Output `.screens/<name>.png`.
- `screenshot-device.mjs`: real mobile emulation (true 390px layout viewport) and a horizontal overflow check. Output `.screens/<name>.png`.
- `screenshot-landing.mjs`: several shots of `/` in one session. A shot is `t:<seconds>` (seek animations) or `y:<px>` (scroll). Output `.screens/landing/<prefix>-<shot>.png`.
- `probe-page.mjs`: fetches a URL and reports which strings appear in the HTML.
- `probe-status.mjs`: fetches without following redirects and prints status and `Location`.
- `tick-tasks.mjs`: ticks task ids in `docs/specs/renewly/tasks.md`. This edits the file; with no ids it does nothing.

## Env and database scripts

These stay in `scripts/` because npm scripts call them.

| Command | Purpose |
| --- | --- |
| `npm run check:env` | Checks `.env.local` and reports names and pass/fail, never values |
| `npm run check:auth` | Reads the Supabase project's public auth settings and explains them |
| `npm run db:migrate` | Applies pending `supabase/migrations/*.sql`. Warning: it applies them to whatever `SUPABASE_DB_URL` points to. Use `-- --dry` first to list what would run |
| `npm run test:rls:local` | SQL and RLS tests on embedded Postgres (PGlite). No account needed |
| `npm run test:rls` | The same tests against `SUPABASE_DB_URL`. Throwaway dev database only, never production |

## Tests and checks

- `npm test`: unit and component tests (Vitest, single run).
- `npm run lint`, `npm run check:tokens`, `npm run build`: lint, design token contrast check, production build.

## Seed data

`supabase/seed.sql` is demo data for the first user in `auth.users`. Run it by hand (Supabase SQL editor) in a dev project only. The app and the deploy never apply it, and it must not run in production. The local Supabase CLI runs it on `supabase db reset`, which only touches the local database.

## Secrets

- `.env*` files are never committed. `.env.example` holds names only.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public.
- The service-role key and `SUPABASE_DB_URL` never get a `NEXT_PUBLIC_` prefix and are never set as public variables on Vercel.

## Housekeeping

- Git-ignored local folders: `.screens/`, `.agents/`, `design-reference/`, `.kiro/settings/`.
- Local-only agent skill folders `.kiro/skills/` and `.taste-skill/` are excluded through `.git/info/exclude`, so they are not in `.gitignore`.
