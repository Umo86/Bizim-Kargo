# Bizim Kargo

A two-sided cargo-quote marketplace for shipping between the **United Kingdom and
Turkey** (plus UK and Turkey domestic lanes). Customers enter a route and their
items and instantly compare priced quotes from cargo companies; carriers — from
international freight forwarders to man-and-van operators — join free, publish
their rates through a guided wizard, and receive booking leads directly.

No payment flows through the platform: the customer and carrier are introduced
and deal with each other directly.

## How it works

1. **Customer** enters pickup/delivery (country + postcode/city), their items
   (dimensions + weight, or a vehicle description) and optional insurance.
2. The **pricing engine** computes each carrier's price exactly the way real
   freight is priced:
   - *Chargeable weight* = max(actual kg, volumetric kg), volumetric kg =
     L×W×H cm³ ÷ divisor (3000 road groupage, 5000 courier/air parcel,
     6000 IATA, 1000 sea — set per service).
   - *Volume (m³) services* use the W/M rule: max(volume, actual kg ÷ 333).
   - Tariffs are **cumulative bands** ("£75 covers the first 10 kg, then
     £7/kg to 30 kg…"), so a heavier shipment can never price cheaper than a
     lighter one, with a minimum charge floor.
   - Surcharges on top: fuel % (on base freight only), customs clearance
     (cross-border only), collection/delivery/residential fees, remote-zone
     surcharges (Highlands, NI, islands, Eastern Anatolia…), optional insurance
     (% of declared value with a minimum premium).
   - Import duties and taxes are **never** included and every quote says so.
3. Results are ranked (cheapest / fastest / best rated) with a full per-line
   price breakdown and a plain-English explanation of the chargeable weight.
4. On booking, the **lead** (contact + full shipment detail + price snapshot)
   lands in the carrier's dashboard and both sides get an email introduction.

## Stack

- **Next.js 15** (App Router) · React 19 · TypeScript strict · **Tailwind v4**
- **Supabase** (Postgres + Auth) — optional; the app runs fully in **demo mode**
  without any environment variables, using 5 seeded demo carriers and an
  in-memory store
- **Resend** for transactional email — optional; without an API key, emails are
  logged to the server console
- **Vitest** for the pricing engine (68 tests) · Playwright for E2E

## Getting started

```bash
npm install
npm run dev          # demo mode — no configuration needed
```

Open http://localhost:3000, get a quote, book it, then visit
`/carrier/login → View demo dashboard` to see the lead arrive.

### Tests

```bash
npm test             # pricing engine unit tests
npm run lint
npx tsc --noEmit
npm run build
```

## Connecting Supabase (production mode)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor run, in order:
   - `supabase/migrations/0001_init.sql` (schema, RLS policies, triggers)
   - `supabase/seed.sql` (optional: the 5 demo carriers with realistic rates)
3. Copy `.env.example` → `.env.local` and fill in from *Project Settings → API*:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only, used by admin actions |
| `RESEND_API_KEY` | optional — lead notification emails |
| `EMAIL_FROM` | sender, e.g. `Bizim Kargo <noreply@yourdomain>` |
| `NEXT_PUBLIC_SITE_URL` | absolute site URL for emails/metadata |

With Supabase configured: carrier signup/login are real (email confirmation
supported), published rate cards go live for customers instantly, leads persist,
and admins (set `profiles.role = 'admin'` for your user) can verify carriers at
`/admin/carriers`.

## Deployment

Standard Next.js — deploys to Vercel/Netlify/Railway unchanged. Set the
environment variables above in your host. `npm run build && npm start` for
self-hosting.

## Project layout

```
src/lib/types.ts          domain contract (lanes, items, services, tiers, quotes, leads)
src/lib/pricing/          pure pricing engine + 68 unit tests
src/lib/zones.ts          UK postcode areas + all 81 TR provinces → pricing zones
src/lib/demo-data.ts      5 demo carriers / 22 services (mirrors supabase/seed.sql)
src/lib/data.ts           repository layer (Supabase ⇄ in-memory demo store)
src/lib/actions.ts        server actions: create quote, book, carrier leads
src/lib/email.ts          Resend wrapper + branded lead/confirmation templates
src/app/                  homepage, /quote funnel, /carrier portal, /admin, content pages
supabase/                 migration (schema + RLS) and seed SQL
```

## Adding a country

Lanes are data, not code: extend `CountryCode`/`COUNTRIES` in
`src/lib/types.ts`, add its zones to `src/lib/zones.ts`, and carriers can
immediately publish rate cards for the new lane through the wizard.

## v1 scope notes

Payments, shipment tracking, carrier API integrations, customer accounts,
customer-written reviews and Turkish localisation are intentionally out of
scope. Ratings shown are set at verification time by the platform admin.
