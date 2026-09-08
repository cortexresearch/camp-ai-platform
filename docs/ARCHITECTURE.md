# 🏕️ AI — Architecture

**🏕️ AI** is a live AI build competition produced by **@NFTmansa**. Builders
get a window (currently 30 minutes) to ship something with AI tools, then
submit what they made and everyone votes on their favorites. This is Season
1 — the platform is intentionally small right now and grows only as
features are actually needed.

This document describes how the platform in this repo is put together.

## Status: real, live, minimal

Everything in this repo is a real, working system backed by a live Postgres
database (hosted on Railway) — no seed data, no simulated auth, no demo
mode. The feature set is deliberately small:

- Sign up / log in (session-based auth, `bcryptjs` + a `sessions` table)
- Pick a role at signup — `builder` or `judge` — no admin approval step
- Submit a build for the current episode
- Vote on builds (one vote per build per account)
- A public profile per user at `/u/[handle]`, with an editable portfolio of
  past work (title, link, description)

There is no rubric, judging panel, scoring pipeline, sponsor system, season
calendar, or prior-season history — those don't exist yet. Don't add UI or
copy that implies they do; if/when a real judging process is built, it
should be documented here and on `/rules` at the same time.

## Stack

- **Next.js 15** (App Router), React 19, TypeScript 5.7.
- **Tailwind CSS v4**, configured via `@tailwindcss/postcss` — no `tailwind.config` file, tokens live in `src/app/globals.css`.
- **Postgres** via the raw `pg` driver (`src/lib/db.ts`) — no ORM. Queries are written inline with `pool.query(...)` in server components and server actions.
- No external UI kit — all primitives (`Card`, `Button`, `Pill`, `Stat`, `Meter`, `PageHero`, `SectionHeading`, `Avatar`, `EmptyState`, …) are hand-built in `src/components/ui.tsx`.
- No auth provider (NextAuth/Clerk/etc.) — auth is a small hand-rolled session system, see below.

## Folder structure

```
src/
  app/
    page.tsx              homepage — real top-builds query against Postgres
    signup/ login/         auth forms
    submit/                build submission form
    builds/                all builds + voting
    u/[handle]/             public profile + portfolio (add/remove items)
    about/ how-it-works/ rules/ faq/ code-of-conduct/ contact/ partnership/
                            static/info pages, all describing the real flow
  components/
    ui.tsx                design-system primitives
    SiteChrome.tsx         header/nav/footer shell, wraps every page
    MobileNav.tsx           mobile nav drawer
    ContactForm.tsx        the one form that isn't an auth/build/portfolio action
  lib/
    db.ts                  pg Pool singleton, reads DATABASE_URL
    auth.ts                signup/login/logout/getCurrentUser, session cookie handling, handle generation
    actions.ts             "use server" actions: signup, login, logout, submit build, vote, portfolio add/delete
docs/
  ARCHITECTURE.md          this file
db/
  app_schema.sql            the real schema, applied via scripts/migrate.mjs
scripts/
  migrate.mjs               reads db/app_schema.sql and applies it to DATABASE_URL
```

## Domain model

Defined entirely in `db/app_schema.sql` — four core tables plus one for
portfolios:

- **`users`** — `id, name, email, password_hash, role ('builder'|'judge'), handle, created_at`. `handle` is unique and slugified from `name` at signup (with a numeric suffix on collision) — it's the public profile URL segment.
- **`sessions`** — `token, user_id, created_at, expires_at`. The `campai_session` httpOnly cookie holds the token.
- **`builds`** — one submission per user per episode: `title, how_it_works, models_used, token_cost, prompts_issues, episode`.
- **`votes`** — `(build_id, user_id)` composite primary key, so a vote is naturally idempotent per user per build.
- **`portfolio_items`** — `user_id, title, url, description` — free-form "previous work" entries a user manages on their own profile.

## Auth

`src/lib/auth.ts` is the whole auth system:

- `signup(name, email, password, role)` — validates, hashes the password with `bcrypt`, generates a unique `handle`, inserts the user, creates a session.
- `login(email, password)` — verifies the password hash, creates a session.
- `getCurrentUser()` — reads the session cookie, joins `sessions` → `users`, returns `null` if missing/expired.
- `logout()` — deletes the session row and clears the cookie.

Role is chosen once at signup via a radio picker on `/signup` and is
permanent — there's no role-change flow yet.

## Portfolio / public profile

`src/app/u/[handle]/page.tsx` renders any user's public profile: name, role
badge, and their `portfolio_items`, newest first. If the viewer is signed in
and viewing their own profile, they get an inline add-item form and a
remove button per item (`addPortfolioItemAction` /
`deletePortfolioItemAction` in `src/lib/actions.ts`). Deletion is scoped by
`user_id` in the `WHERE` clause, not just the item id, so ownership is
enforced at the query level.

## Rendering strategy

Server components query Postgres directly (`await pool.query(...)`) and
render — no client-side data fetching for content that doesn't need it.
Pages that must always reflect the latest DB state (home page, builds,
profile) set `export const dynamic = "force-dynamic"` or rely on
`revalidatePath` calls from the relevant server action.

## Local development

```bash
npm install
npm run migrate       # applies db/app_schema.sql to $DATABASE_URL
npm run dev            # next dev
npm run typecheck      # tsc --noEmit
npm run build           # production build
npm run lint
```

Requires a `DATABASE_URL` env var (Postgres connection string) in `.env.local`.
