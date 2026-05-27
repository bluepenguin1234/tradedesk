# TradeDesk — Project Overview & Build Checklist

_Last comprehensive update: 2026-05-27_

## What This Is

TradeDesk is a focused SaaS for solo contractors (any trade). It replaces scattered Word docs, spreadsheets, and mental load with three things in one place: send a quote, send an invoice, get paid. The moat is **simplicity** — a 5-year-old can use it, deliberately less powerful than Jobber/Housecall Pro.

**Brand promise:** "The admin you never had."
**Price:** $97/mo · First month free · No contracts
**Design spec:** `docs/design-spec.md`
**Design + plan docs:** `docs/superpowers/specs/`, `docs/superpowers/plans/`
**Dev server:** `npm run dev -- --port 4000` → http://localhost:4000
**Production URL:** https://tradedesk-dun.vercel.app
**GitHub:** https://github.com/bluepenguin1234/tradedesk
**Supabase project:** `kvfaglisawwvgzyngswt`
**Vercel project:** `prj_P3aNWCerJ5pRObAB78Af7bWAxjtn` (team `team_jJo1reYYCZB3n1McypaEJUIc`)

---

## Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS | Marketing site + contractor dashboard |
| Hosting | Vercel | Deploy and serve the app, env management |
| Database | Supabase (Postgres 17) | All app data |
| Auth | Supabase Auth | Email/password sign-in |
| File storage | Supabase Storage | Logo uploads (bucket: `logos`, public) |
| Subscriptions | Stripe Checkout (subscription mode) | $97/mo Pro with 30-day free trial, card required upfront |
| Invoice payments | Stripe Connect Express | Contractors connect their own Stripe; clients pay directly to them via Payment Links |
| Platform email | Resend | Welcome, quote send, invoice send, paid-notifications |

**Fixed cost:** ~$25–30/mo (Supabase Pro). Break-even: 1 subscriber.

---

## The Three Things (Product Surface)

The user's mental model is *three columns on a dashboard* — not three separate apps.

1. **To Do** — what needs the contractor's action: send a quote, send an invoice, finish a draft. One button per card.
2. **Waiting** — sent out, ball is in the client's court: quote awaiting response, invoice awaiting payment. Subdued cards with a "Send a reminder" link.
3. **Done** — paid this month. Green confirmation cards with amount + when.

Behind the scenes there are still projects + quotes + invoices in the DB — but the dashboard never uses those words in the UI. Everything is "the client's job."

---

## Dashboard Architecture (mobile-first, current)

**Layout:** [app/dashboard/layout.tsx](app/dashboard/layout.tsx) — no sidebar. Bottom tab bar fixed to the viewport with `safe-area-inset-bottom` padding for iOS. Three tabs: **Overview · Clients · Settings**.

**Pages reachable from nav:**
- `/dashboard` — Overview (greeting + 3 action tiles + 3 stacked sections)
- `/dashboard/clients` — searchable client list
- `/dashboard/settings` — logo, Stripe Connect status, log out

**Pages reachable by deep link only (no nav entry):**
- `/dashboard/clients/[id]`, `/new` — full CRUD with inline edit
- `/dashboard/quotes`, `/quotes/[id]`, `/quotes/new` — list, detail (Send, Edit, Mark accepted/declined, Delete), new form
- `/dashboard/invoices`, `/invoices/[id]`, `/invoices/new` — same pattern
- `/dashboard/projects`, `/projects/[id]`, `/projects/new` — kept for deep-link continuity, not surfaced in nav (projects table backs the pipeline but the user never says "project")

**Dashboard components** ([app/dashboard/_components/](app/dashboard/_components/)):
- `BottomNav.tsx` — 3-tab nav (client component, `usePathname` for active state)
- `Greeting.tsx` — "Good {morning/afternoon/evening}, {first_name}." + date
- `ActionTiles.tsx` — 3 tiles: **New Quote** (primary green) · **New Invoice** · **Add Client**
- `JobCards.tsx` — renders the 3 stacked sections from a `JobCard[]` input
  - To Do cards: white, big primary button per card (Send quote / Send invoice / Finish & send)
  - Waiting cards: dashed-border subdued, "Send a reminder" link, no button
  - Done cards: light-green, "$X paid" + "ago" timestamp

**Card derivation** ([lib/jobs.ts](lib/jobs.ts)):
`buildJobCards({ projects, quotes, invoices, clients })` is a pure function that returns a sorted `JobCard[]`. Rules:
- All projects render as cards (status drives column)
- Orphan quotes (no `project_id`) render as cards, **except** declined and invoiced (invoiced quotes are represented by their invoice card)
- Orphan invoices render as cards
- Recent clients (≤14d) with no work yet render as Lead cards in To Do
- Paid invoices appear in Done for 60 days

**Inline send buttons (only on draft quotes/invoices):** the QuoteCard/InvoiceCard variants had a hover-revealed `Send` button. The current JobCard.todo treatment uses a full-width button instead — more thumb-friendly on mobile.

---

## Onboarding & Auth Flow

Signup is now a **redirect-to-Checkout** flow (was previously silent server-side subscription creation):

1. User fills `/sign-up` form (first name, last name, email, trade, password)
2. POST `/api/onboard`:
   - Creates Supabase auth user via admin client
   - Creates Stripe customer with `metadata.supabase_id`
   - Inserts profile row with `subscription_status: 'incomplete'`
   - Creates **Stripe Checkout Session** in `mode: 'subscription'` with:
     - `trial_period_days: 30`
     - `payment_method_collection: 'always'` (card required)
     - `success_url: ${origin}/dashboard?welcome=1`
     - `cancel_url: ${origin}/pricing?canceled=1`
   - Signs the user in (cookie set) so they're logged in when they return
   - Returns `{ checkout_url }`
3. Sign-up page does `window.location.href = checkout_url` → user lands on Stripe Checkout, enters card, returns to dashboard
4. Webhook `checkout.session.completed` (mode=subscription) flips `profiles.subscription_status` from `incomplete` → `trialing` and records `stripe_subscription_id` + `trial_ends_at`

If the user abandons Checkout, they're still logged in with an `incomplete` subscription. They can retry from `/pricing` or by re-running signup.

---

## Supabase Database

All 5 tables have RLS enabled. Policy: `auth.uid() = user_id` (or `id` for profiles).

| Table | Notable columns |
|---|---|
| `profiles` | id (=auth.uid), first_name, last_name, trade, stripe_customer_id, stripe_subscription_id, stripe_connect_account_id, stripe_connect_onboarded, subscription_status, trial_ends_at, **logo_url** |
| `clients` | name, email, phone, address, notes, user_id |
| `projects` | name, status, start_date, end_date, notes, client_id, user_id |
| `quotes` | quote_number, status, line_items (JSONB), tax_rate, subtotal, total, notes, expires_at, sent_at, accepted_at, accepted_name, client_id, project_id, user_id |
| `invoices` | invoice_number, status, line_items (JSONB), tax_rate, subtotal, total, **notes**, due_date, **stripe_payment_link**, **stripe_payment_link_id**, stripe_payment_intent_id, sent_at, paid_at, client_id, project_id, quote_id, user_id |

**FK gotcha:** `clients.user_id` → `profiles.id` (ON DELETE CASCADE). If an auth user exists without a profile row, all client/project/quote/invoice inserts fail FK constraint. Fix: insert a profile row. (Hit during dev; backfill ran for `suchanekbs@gmail.com` user.)

**Recent schema migrations (this session):**
- `invoices.notes` (text) — added 2026-05-27
- `invoices.stripe_payment_link_id` (text) — added 2026-05-27, used by webhook to match payments back to invoices

---

## Supabase Storage

- Bucket `logos`, public (CDN-readable without auth)
- File convention: `{user_id}/logo.{ext}`
- **RLS on `storage.objects`** — 4 policies added 2026-05-27 (INSERT/UPDATE/DELETE/SELECT), all scoped to `bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text`. Without these, upload fails with "new row violates row-level security policy."

**Where the logo appears:**
- ✅ Settings page (preview + replace)
- ✅ Public quote page (`/quotes/[id]`) — top-left of header
- ✅ Quote send email — `<img>` at top of body
- ✅ Invoice send email — `<img>` at top of body
- ❌ Stripe Checkout / Payment Link pages — separate upload at Stripe Dashboard → Settings → Branding (account-wide)

---

## Stripe Configuration

**TradeDesk's own account (`acct_1Tb7NtEBZKt8k1Ze`):**
- Display name: `TradeDesk`
- Public-facing name (`business_profile.name`): **not set** — Stripe Checkout currently shows the truncated statement descriptor "pointpicku" (from `POINTPICKUP.COM`). To fix: Stripe Dashboard → Settings → Public Details → set Business Name to `TradeDesk`. **Live key required** (can't be done via API in test mode).
- Connect Platform Profile: completed (was the first Connect blocker resolved this session)

**Webhook endpoints registered in test mode:**
- `we_1Tb81qEBZKt8k1Ze0JFZWQWE` — **platform** (subscription events, invoice events on the platform account)
- `we_1TblKREBZKt8k1Ze864mdx5U` — **Connect** (events on connected accounts, primarily `checkout.session.completed` for invoice payments)
- Both point at `https://tradedesk-dun.vercel.app/api/webhooks/stripe`
- Each has its own secret. The handler tries both — see `lib/stripe` and `app/api/webhooks/stripe/route.ts:verifyEvent`.

**Invoice payment flow:**
1. `POST /api/invoices/[id]/send` creates a Stripe Payment Link **on the contractor's connected account** (`{ stripeAccount: profile.stripe_connect_account_id }`)
2. Persists `stripe_payment_link` (URL) + `stripe_payment_link_id` on the invoice
3. Emails client a "Pay Now" button linking to the Payment Link
4. Client pays with card → Stripe spawns Checkout Session on the connected account → `checkout.session.completed` fires on the Connect webhook
5. Handler matches `session.payment_link` to `invoices.stripe_payment_link_id`, flips status to `paid`, emails contractor a paid-notification

**Currently in test mode** (`sk_test_…`). To go live, swap four env vars:
- `STRIPE_SECRET_KEY` (sk_test → sk_live)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test → pk_live)
- `STRIPE_PRO_PRICE_ID` (recreate $97/mo product in live mode)
- `STRIPE_WEBHOOK_SECRET` + `STRIPE_WEBHOOK_SECRET_CONNECT` (register live webhook endpoints, copy new secrets)

---

## Resend Configuration

- `lib/resend.ts` validates `RESEND_API_KEY` (must start with `re_`) and `RESEND_FROM_EMAIL` (printable ASCII only — guard against env values with newlines/garbage). Throws clear errors instead of letting undici choke deep in the SDK.
- Currently sending from `onboarding@resend.dev` — **only delivers to the Resend account owner's email address**. Real client emails won't go out until a domain is verified.
- Domain verification = task #25, parked. Pick + buy a domain → add in Resend → SPF + DKIM DNS records → update `RESEND_FROM_EMAIL` in Vercel.

**Send-route discipline (both quote and invoice):**
- Email is sent FIRST, status update happens after success. If email fails, the entity stays draft and the user can retry. Avoids the "DB says sent but no email landed" lie.
- Invoice route also catches Stripe Payment Link errors separately so the user sees "Stripe: {reason}" instead of a generic 500.

---

## Vercel Environment Variables (production)

| Key | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role JWT (admin client) |
| `STRIPE_SECRET_KEY` | **Test mode** (`sk_test_…`) currently |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Test publishable key |
| `STRIPE_PRO_PRICE_ID` | Test-mode $97/mo price |
| `STRIPE_WEBHOOK_SECRET` | For platform endpoint signature verify |
| `STRIPE_WEBHOOK_SECRET_CONNECT` | For Connect endpoint signature verify (added 2026-05-27) |
| `RESEND_API_KEY` | Real `re_…` key (fixed 2026-05-27 — was previously set to landing page text) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` (added 2026-05-27 — was missing) |
| `NEXT_PUBLIC_APP_URL` | `https://tradedesk-dun.vercel.app` (added 2026-05-27 — was missing) |

All API routes that reference `NEXT_PUBLIC_APP_URL` fall back to `req.nextUrl.origin` if the env var is missing.

---

## API Routes

All under `app/api/`. All `[id]` routes use Promise-typed params (Next.js 15 async params).

| Route | Methods | Purpose |
|---|---|---|
| `/api/onboard` | POST | Create user + customer + Checkout session, return checkout URL |
| `/api/auth/login` | POST | Sign in, set cookie |
| `/api/auth/logout` | GET | Clear cookie, redirect to /login |
| `/api/profile` | GET | Return profile incl. logo_url and stripe_connect_onboarded |
| `/api/logo` | POST, DELETE | Upload/remove user's logo |
| `/api/clients` | GET, POST | List (search by name), create |
| `/api/clients/[id]` | GET, PUT, DELETE | Detail (with related quotes/invoices/projects), update, delete |
| `/api/projects` | GET, POST | List (filter by status), create |
| `/api/projects/[id]` | GET, PUT, DELETE | Detail, update (advance pill on dashboard hits this), delete |
| `/api/quotes` | GET, POST | List (filter by status), create with auto quote_number |
| `/api/quotes/[id]` | GET, PUT, DELETE | Detail, update (recomputes totals on line_item/tax change), delete (drafts only) |
| `/api/quotes/[id]/send` | POST | Email client, mark sent (email-first, then status) |
| `/api/quotes/[id]/accept` | POST (public) | Client signs and accepts |
| `/api/quotes/[id]/public` | GET (public) | Client-facing quote read (includes logo_url) |
| `/api/invoices` | GET, POST | List, create; bumps linked quote→invoiced and project→invoiced |
| `/api/invoices/[id]` | GET, PUT | Detail, update (Mark paid stamps paid_at) |
| `/api/invoices/[id]/send` | POST | Create Payment Link on connected account, email client, mark sent (with `code: 'connect_required'` if Stripe Connect not onboarded) |
| `/api/stripe/connect` | GET | Create Express account if needed, create accountLink, redirect to Stripe onboarding. Try/catch wraps everything and renders a friendly HTML error page on failure |
| `/api/stripe/connect/callback` | GET | Verify completion via `account.retrieve`, write `stripe_connect_onboarded`, redirect to /dashboard |
| `/api/webhooks/stripe` | POST | Handles `customer.subscription.{updated,deleted}`, `invoice.payment_{succeeded,failed}`, and `checkout.session.completed` (both signup-subscription and invoice-payment-on-connected-account paths). Verifies signature against either platform or Connect secret. |
| `/api/cron/trial-emails` | GET | Stub |
| `/api/cron/invoice-reminders` | GET | Stub |
| `/api/contact` | POST | Marketing-site inquiry form → Brian |

---

## Utilities

- [lib/supabase.ts](lib/supabase.ts) — browser client, server client (cookie-based), admin client (service role)
- [lib/stripe.ts](lib/stripe.ts) — lazy-init Stripe via Proxy (avoids build-time crash)
- [lib/resend.ts](lib/resend.ts) — lazy-init Resend + sendEmail; validates env values before calling
- [lib/jobs.ts](lib/jobs.ts) — `buildJobCards()` pure function for the dashboard
- [lib/pipeline.ts](lib/pipeline.ts) — `statusToColumn`, `nextStatus`, `ALL_STATUSES`, `PipelineItem`, `itemToColumn` (legacy from earlier 5-column version, still used by some helpers)
- [middleware.ts](middleware.ts) — protects `/dashboard/*`
- [vercel.json](vercel.json) — cron schedule
- [types/index.ts](types/index.ts) — TS interfaces

---

## Pre-Launch Checklist

### Done in this session (2026-05-27)
- [x] Mobile-first dashboard redesign (bottom nav, 3-section pipeline)
- [x] Signup → Stripe Checkout redirect with card capture
- [x] Connect-account webhook routing (separate endpoint + dual-secret verification)
- [x] Invoice payment matching by `payment_link_id`
- [x] Send-route reordering (email first, status second)
- [x] Resend env hardening + replaced bad API key
- [x] Stripe Connect friendly error page
- [x] Logo upload RLS policies
- [x] Logo rendered on public quote page + in send emails
- [x] Test mode end-to-end verified: signup → trial → quote send → public quote → invoice send → Payment Link → test card pay → webhook → invoice paid → notification email

### Still needed before charging real money
- [ ] **#25 Verified Resend sending domain** — currently `onboarding@resend.dev` only delivers to your own email
- [ ] **Stripe live mode** — swap 4 env vars (see Stripe section above)
- [ ] **Stripe business_profile.name** — set to `TradeDesk` in Dashboard (one-click in live mode)
- [ ] **Stripe Branding logo** — upload square logo at Stripe Dashboard → Settings → Branding (shows on Checkout pages)
- [ ] **Cron logic** — `/api/cron/trial-emails` and `/api/cron/invoice-reminders` are still stubs

### Lower-priority polish
- [ ] Auto-create invoice when client accepts quote on public page (skips a step)
- [ ] Cancel-subscription flow in Settings
- [ ] Email change / password change UI in Settings

---

## Revenue Math

| Scenario | Monthly Revenue |
|---|---|
| Fixed cost (Supabase) | ~$30/mo |
| Break even | 1 subscriber |
| 10 subscribers | $970/mo |
| 25 subscribers | $2,425/mo |
| 50 subscribers | $4,850/mo |
| 100 subscribers | $9,700/mo |
| + Website hosting (10 sites × $50/mo) | +$500/mo |

---

## Running Locally

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
npx vercel env pull .env.local --environment=production
npm run dev -- --port 4000
```

**Heads up about `vercel env pull`:** values for "Encrypted" env vars come back as empty strings — they can't be decrypted locally. To run the app locally you need to manually set values (e.g., from Supabase/Stripe/Resend dashboards) OR develop directly against Vercel preview deploys.

**Ports 3000–3002 are taken by other projects** — use 4000.

**Known harmless warning:** *"The 'middleware' file convention is deprecated. Please use 'proxy' instead."* — Next.js 16 thing, no impact.

---

## Build & Deploy

```bash
# Build (type-check + production bundle)
npm run build

# Manual production deploy (not normally needed — pushes to main auto-deploy)
npx vercel --prod --yes
```

Last clean build: 2026-05-27. **38 routes** compiled, no errors.

Production: https://tradedesk-dun.vercel.app — auto-deploys from `main` branch push.

---

## Debugging Reference

When something breaks in production, in priority order:
1. **Vercel Runtime Logs** — Vercel MCP `get_runtime_logs` filtered by route path or error keyword
2. **Supabase SQL editor / MCP** — verify DB state, check RLS policies (`SELECT … FROM pg_policy WHERE polrelid = 'storage.objects'::regclass`)
3. **Stripe Dashboard event log** — for webhook delivery debugging; failed deliveries show retry attempts
4. **Browser console / Network tab** — for client-side issues

Common gotchas hit this session:
- Empty env var in template literal → `"undefined/path"` → Stripe rejects with "Redirect urls must be HTTPS"
- Missing RLS policy on `storage.objects` → "new row violates row-level security policy"
- Wrong invoice match key in webhook → invoice stays `sent` forever after payment
- `checkout.session.completed` on connected account requires a **separate webhook endpoint** with `connect: true`
- Resend env value with newlines → undici throws `Headers.append: Invalid value`
