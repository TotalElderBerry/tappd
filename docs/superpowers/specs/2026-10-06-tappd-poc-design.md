# Tappd — Proof of Concept Design

**Date:** 2026-10-06
**Status:** Approved in brainstorming, pending written-spec review

## 1. Purpose

Tappd sells custom NFC + QR cards (and websites bundled with cards) to local businesses in Cebu. This proof of concept is the internal system that turns a sold package into working cards: every card carries a permanent Tappd link, and the admin decides — and can later change — where that link sends people.

**Who uses it:** Tappd staff only (admin). Customers order and pay by message (Facebook, email; GCash / Maya / bank transfer) exactly as the marketing site says today. The system is built so customer logins can be added later, but none exist in this POC.

**Success looks like:**
- An admin can record an order for any package on the pricing page, and the right number of cards is generated.
- Each card has a chip URL and QR code the admin can program and print; tapping or scanning it reaches the destination the admin set.
- Changing a card's destination takes effect on the next tap, with no reprint or rewrite.
- Tap Page customers get a live profile page that looks exactly like `design/07-tap-page-sample.html`.
- The marketing site runs inside the app and looks exactly like `design/05-website.html`.
- Taps are counted per card, split by NFC vs QR.

## 2. Hard constraints

1. **Do not change the design of the two supplied HTML files.** `design/05-website.html` and `design/07-tap-page-sample.html` are the reference. Their CSS ships verbatim; their markup and class names are reproduced exactly. Tailwind is never loaded on those pages.
   - Approved exceptions (copy and behavior only, not design):
     - The 07 "Sample controls" strip is demo-only and does not appear on live pages; its controls move into the admin editor.
     - "Sample page · This would…" toasts are replaced by the real action.
     - The Save-contact sheet text becomes: "This downloads a contact card that opens straight in your phone's Contacts app."
     - Hours support minutes (e.g. 7:30 AM), not just whole hours.
2. **Stack:** Nuxt 4 (Vue), Tailwind CSS, shadcn-vue, Neon Postgres. Supporting choices: Drizzle ORM with `@neondatabase/serverless`, `nuxt-auth-utils`, zod, Vercel hosting, Vercel Blob for images.
3. **The chip and QR always hold `<base>/t/<code>`**, never a final destination. `<base>` is an environment setting.
4. **Physical chip writing is manual** (e.g. NFC Tools on a phone). The app produces and manages URLs; it does not talk to NFC hardware.
5. **No online payments, invoices, or customer accounts** in this POC.

## 3. Architecture

One Nuxt 4 app on Vercel. Nitro server routes handle redirects, vCards, and the admin API. Neon holds data; Vercel Blob holds images.

### Routes

| Route | Purpose | Rendering / styles |
|---|---|---|
| `/` | Marketing site (05 ported verbatim) | SSR, 05 CSS only |
| `/t/:code` | Card resolver: look up card, log tap, 302 to destination | Server route |
| `/:slug` | Public Tap Page (07 design, data from DB) | SSR, 07 CSS only |
| `/:slug/contact.vcf` | vCard download for a Tap Page | Server route |
| `/_preview/tap-page` | Renders a Tap Page from draft data posted by the editor (admin session required) | SSR shell, 07 CSS only |
| `/admin/**` | Dashboard | Tailwind + shadcn-vue, auth required |
| `/api/admin/**` | Dashboard JSON API | Server routes, auth required |

### Style isolation

- Three style worlds — marketing CSS, Tap Page CSS, Tailwind — each loaded only by its own layout.
- 05 and 07 share class names and global selectors with conflicting rules (`.links`, `footer`, `section`, `:root` variables). Links between marketing and Tap Pages (e.g. "Made with tappd") are full page loads (`<a href>` / `external`), never client-side navigation, so the two stylesheets never coexist in one document.
- Each public page sets the same `<title>` and Google Fonts as its source file.

### Identifiers

- **Card code:** 6 characters from an unambiguous lowercase alphabet (no `0 o 1 l i`), random, unique; regenerate on collision. Example: `x7k2qm`.
- **Chip URL:** `<base>/t/<code>`. **QR URL:** `<base>/t/<code>?s=qr` (lets taps be split by source).
- **Slug:** `^[a-z0-9]+(-[a-z0-9]+)*$`, 2–40 chars, unique. Reserved: `admin`, `api`, `t`, `_nuxt`, `_preview`, `favicon.ico`, `robots.txt`, `sitemap.xml`.
- **Base URL caveat:** during the POC `<base>` may be a `*.vercel.app` URL. Chips written with it are permanent. Production customer chips must only be written once `tappd.ph` points at the app. The admin shows the current base URL on the Write chips screen.

## 4. Package catalog (hard-coded)

Mirrors the pricing page. Prices in whole pesos.

| Key | Line | Name | Cards | Price sold | Regular | Tap Page | Yearly fee |
|---|---|---|---|---|---|---|---|
| `first_tap` | cards | First Tap | 1 | 599 | 699 | no | — |
| `tap_pack` | cards | Tap Pack | 2–4 | 549 × n | 699 × n | no | — |
| `fully_tappd` | cards | Fully Tappd | 5 | 2,500 | 3,495 | no | — |
| `tappd_team` | cards | Tappd Team | 6+ (admin enters) | admin enters | — | no | — |
| `tap_page` | website | Tap Page | 1 | 1,499 | 1,799 | yes | 499 |
| `launch_kit` | website | Launch Kit | 2 | 5,999 | 7,999 | no | 2,499 |
| `fully_online` | website | Fully Online | 5 | 13,999 | 17,999 | no | 3,999 |

Launch Kit and Fully Online websites are built outside this system; their cards use `url` destinations pointing at the customer's domain.

## 5. Data model (Neon / Drizzle)

All tables have `id` (uuid), `created_at`, `updated_at`.

- **`admins`** — `email` (unique), `password_hash`, `name`. Seeded from env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`).
- **`customers`** — `name`, `contact_name`, `phone`, `email`, `facebook`, `notes`.
- **`orders`** — `customer_id`, `package_key`, `card_count`, `price_php`, `regular_price_php` (nullable), `status` (`awaiting_payment` | `paid` | `in_production` | `delivered`), `paid_at`, `notes`, `design` (jsonb: `color`, `logo_url`, `font_preset`).
- **`cards`** — `code` (unique), `order_id`, `label`, `purpose` (`google_review` | `instagram` | `facebook` | `tiktok` | `menu` | `business_card` | `website` | `custom`), `destination_type` (`none` | `url` | `tap_page` | `vcard`), `destination_url`, `tap_page_id`, `vcard` (jsonb: `full_name`, `title`, `org`, `phones[]`, `emails[]`, `url`, `address`), `active` (bool, default true), `written_at`, `design` (jsonb: `template`, `headline`, `subtext`, `show_strip`), `design_approved_at`.
  - Invariant: exactly the field matching `destination_type` is set (`url` → `destination_url`, `tap_page` → `tap_page_id`, `vcard` → `vcard`).
- **`tap_pages`** — `customer_id`, `slug` (unique), `profile_type` (`business` | `personal`), `color`, `cover_url`, `avatar_url`, `show_cover`, `show_avatar`, `published` (bool), `content` (jsonb shaped like the 07 `PROFILES` entry: `name`, `first`, `role`, `tagline`, `facts`, `hours` (with minutes), `statusWords`, `quick`, `contact`, `sections`; every link/social/tile item gains a `url`, tiles gain optional `image_url`).
- **`taps`** — `card_id`, `tapped_at`, `source` (`nfc` | `qr`), `device` (`ios` | `android` | `other`). No IP or full user agent stored.

### Order → cards

Creating an order generates `card_count` cards immediately with `destination_type = none`. If the package includes a Tap Page, a draft `tap_pages` row is created (from the Business template) and the first card is set to `tap_page` pointing at it.

## 6. Card resolver (`/t/:code`)

1. Look up card by `code`.
2. Unknown → branded 404 page. `active = false` or `destination_type = none` → branded "This card isn't set up yet" page.
3. Resolve destination: `url` → `destination_url`; `tap_page` → `<base>/<slug>` (if unpublished, the "not set up yet" page); `vcard` → serve a `.vcf` built from `cards.vcard`.
4. For `url` and `tap_page`, respond **302** (never 301). For `vcard`, respond 200 with `text/vcard`. All responses send `Cache-Control: no-store`.
5. Log the tap via `event.waitUntil` after responding. `source = qr` if `?s=qr`, else `nfc`. Device from user agent. Logging failure never affects the redirect.

## 7. Admin dashboard

Login: email + password via `nuxt-auth-utils` (sealed cookie session, hashed passwords). Every `/admin/**` page and `/api/admin/**` route requires a session.

1. **Home** — orders awaiting payment, orders in production, unassigned cards, taps in the last 7 days.
2. **Customers** — searchable list; detail shows contact info, orders, cards, Tap Page.
3. **New order** — pick or inline-create customer; pick package grouped by Tap cards / Website + cards; Tap Pack shows 2/3/4 picker; Tappd Team takes card count and price; price prefilled from catalog. Saving generates cards (and Tap Page if included).
4. **Order detail** — status stepper, order design (color, logo, font preset), list of cards.
5. **Card editor** (side panel), three tabs:
   - **Details** — label, purpose, destination type and its fields, active toggle.
   - **Design** — template (defaults from purpose: Review us, Follow us, Menu, Business card, Custom), headline, subtext, "TAP OR SCAN" strip toggle; inherits order color/logo/font. Live front/back preview at CR80 portrait proportions (SVG Vue component) with the card's real QR. "Download preview image" (PNG, not print-ready). "Customer approved" toggle sets `design_approved_at`.
   - **Programming** — chip URL in large monospace with Copy, QR preview with PNG/SVG download, Test button, tap stats (total, 7 days, 30 days, NFC vs QR).
6. **Write chips** (per order) — checklist of cards with chip URL, Copy, and "Written ✓" toggle (`written_at`); shows the current base URL and warns on cards without design approval or without a destination.
7. **Card lookup** — enter a code, jump to the card.
8. **Tap Pages** — list and editor (§8).

Out of scope: invoices, payment tracking beyond status, staff roles, bulk edit, charts beyond counts, print-ready export.

## 8. Tap Pages

### Public page

- 07 CSS verbatim. 07's render functions (`sectHTML`, `status`, profile header, sheet, toast) become Vue components emitting identical markup and classes.
- Real actions: quick actions open `tel:`, `sms:`, `https://m.me/<user>`, `viber://chat?number=`, `mailto:`, Google Maps; link/social/tile buttons open their `url`; Share uses `navigator.share` with clipboard fallback; Save contact opens the existing sheet whose button downloads `/:slug/contact.vcf`.
- Open/closed status computed on the server in `Asia/Manila` and refreshed every minute client-side, as in 07.
- Tiles show `image_url` if present, else the 07 placeholder art.
- `show_cover` / `show_avatar` map to the existing `nocover` / `noavatar` classes.
- Unpublished → 404.

### Editor

- Form left, live preview right. Preview is an iframe of `/_preview/tap-page`; the editor posts the unsaved draft via `postMessage`, so the preview uses the real renderer and Tailwind cannot leak in.
- New pages start from a template: Business (Café Luna sample data) or Personal (Andrea sample data).
- Form groups: Identity (type, name, role, tagline, slug, color — 07's five swatches plus custom hex — cover/avatar upload with show toggles); Facts and status words; Hours (per day open/close or closed, with minutes); Quick actions (up to 4); Contact (vCard fields); Sections (add, remove, reorder Links, Socials, Tiles, About, Hours, Location, Areas; optional side-by-side pairing = `duo`).
- Publish toggle and "Open live page".

### vCard

vCard 3.0 from Contact fields, avatar embedded as a small base64 JPEG so it shows in iOS and Android Contacts.

## 9. Marketing site

`design/05-website.html` ported verbatim to `/` — CSS, markup, and its script (tabs, Tap Pack picker). "Get Tappd" buttons still go to `#contact`. No content changes.

## 10. Validation and safety

- zod on every admin API input.
- URL allowlist for destinations and Tap Page items: `https:`, `http:`, `tel:`, `sms:`, `mailto:`, `viber:`. `javascript:` and others rejected.
- Image uploads: `image/*` only, max 5 MB, stored in Vercel Blob.
- Slug uniqueness and reserved list enforced on save.

## 11. Environments and data

- Neon: production branch for live data, separate branch for development and tests.
- Migrations: `drizzle-kit`.
- Seed: admin from env; Café Luna and Andrea Tap Pages (published, slugs `cafeluna` and `andrea`); one demo order per package.
- Env: `DATABASE_URL`, `NUXT_SESSION_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, `NUXT_PUBLIC_BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.

## 12. Testing

- **Unit (Vitest):** package pricing (all rows of §4), code generator (alphabet, length, collision retry), URL allowlist, slug rules, vCard builder, open/closed status in Manila time including minutes and day rollover.
- **Server routes (@nuxt/test-utils):** `/t/:code` for each destination type; tap logged with correct `source`; unknown, inactive, and unassigned codes; unpublished Tap Page; admin API rejects unauthenticated requests; order creation generates correct card count and Tap Page.
- **Design parity (Playwright screenshots):** `/` vs `design/05-website.html`; seeded `/cafeluna` and `/andrea` vs `design/07-tap-page-sample.html` (Business and Personal, controls strip hidden), at phone (375px) and desktop (1280px) widths. The clock is frozen to the same Manila time for both sides so the open/closed status matches.
