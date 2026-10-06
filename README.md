# Tappd

Admin system for Tappd NFC + QR cards: turn a sold package into cards with permanent `/t/<code>` links, set and change where each card goes, count taps, and host Tap Pages.

Stack: Nuxt 4 · Tailwind + shadcn-vue (admin only) · Neon Postgres + Drizzle · Vercel + Vercel Blob.

## Design files are the source of truth

`design/05-website.html` (marketing site at `/`) and `design/07-tap-page-sample.html` (Tap Pages) are served as-is. **Never edit them.** `pnpm test` fails if either changes, and `pnpm test:e2e` screenshot-compares the live pages against them.

## Setup

1. `pnpm install`
2. In Neon, create two branches: `main` (production) and `dev`.
3. `cp .env.example .env`, then fill in the **dev** branch URL, `NUXT_SESSION_PASSWORD` (32+ random chars), `BLOB_READ_WRITE_TOKEN` and the admin login.
4. `pnpm db:migrate`, then `pnpm db:seed`.
5. `pnpm dev`. Open http://localhost:3000 (marketing) and http://localhost:3000/admin.

Seeded demo data: Tap Pages `/cafeluna` and `/andrea`, plus a "Demo Bistro" customer with one order per package.

## Tests

- `pnpm test`: unit and service tests (in-memory PGlite, no setup needed)
- `pnpm test:e2e`: builds the app and runs Playwright. Needs `.env.test`:
  ```
  DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5439/postgres
  NUXT_SESSION_PASSWORD=<32+ chars>
  ADMIN_EMAIL=e2e@tappd.ph
  ADMIN_PASSWORD=e2e-password-123
  ALLOW_DB_RESET=1
  NUXT_SESSION_COOKIE_SECURE=false
  ```
  With a `127.0.0.1` URL, the test run starts its own in-memory Postgres (PGlite), so nothing else is needed. To test against Neon instead, set `DATABASE_URL` to a Neon **test** branch. The e2e run **wipes and reseeds** whatever database it points at.

## Programming a card

1. Admin → order → **Write chips**.
2. Check the banner: chips must only be written once it says `https://tappd.ph`. A chip keeps its URL forever.
3. For each card: **Copy**, then in NFC Tools on your phone go to Write → Add a record → URL → paste → Write, tap the card, and switch **Written ✓** on.
4. Where a card goes can change at any time in the card editor. No rewrite needed.

## Deploying (Vercel)

1. Import the repo into Vercel (it detects Nuxt).
2. Storage → create a Blob store (this sets `BLOB_READ_WRITE_TOKEN`).
3. Environment variables: `DATABASE_URL` (Neon **main** branch), `NUXT_SESSION_PASSWORD`, `NUXT_PUBLIC_BASE_URL=https://tappd.ph`.
4. Run migrations and create the admin against production. Put the main-branch URL and admin login in `.env.production`, then point both commands at that file (plain `pnpm db:migrate` reads `.env`, which is your dev branch):
   ```bash
   DOTENV_CONFIG_PATH=.env.production pnpm db:migrate
   pnpm db:seed --env .env.production
   ```
   In PowerShell: `$env:DOTENV_CONFIG_PATH='.env.production'; pnpm db:migrate`. Seed only adds demo data to an empty database.
5. Add the `tappd.ph` domain in Vercel. Start writing customer chips only after this.
