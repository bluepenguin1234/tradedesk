# TradeDesk — Project Overview & Build Checklist

## What This Is

TradeDesk is a focused SaaS platform for solo contractors (any trade). It replaces scattered Word docs, spreadsheets, and mental load with four tools in one place: quote builder, invoicing with online payments, project status tracking, and a client organizer.

**Brand promise:** "The admin you never had."
**Price:** $97/mo · First month free · No contracts
**Design spec:** `docs/design-spec.md`
**Dev server:** `npm run dev -- --port 4000` → http://localhost:4000
**Production URL:** https://tradedesk-dun.vercel.app
**GitHub:** https://github.com/bluepenguin1234/tradedesk

---

## Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Frontend | Next.js 15 + Tailwind CSS | Marketing site + contractor dashboard |
| Hosting | Vercel | Deploy and serve the app |
| Database | Supabase (Postgres) | All app data — users, clients, quotes, invoices, projects |
| Auth | Supabase Auth | Email/password sign-in |
| File storage | Supabase Storage | Logo uploads (bucket: `logos`, public) |
| Subscriptions | Stripe | $97/mo Pro with 30-day free trial |
| Invoice payments | Stripe Connect Express | Contractors connect their own Stripe; clients pay directly to them |
| Platform email | Resend | Welcome, trial reminders, quote/invoice notifications |

**Fixed cost:** ~$25–30/mo (Supabase). Break-even: 1 subscriber.

---

## The Four Product Features

### 1. Quote Builder
Contractor fills in client name, job description, line items (labor + materials), tax rate, and expiry date. System generates a shareable link. Client opens it in a browser, reviews the quote, clicks Accept → types their name as a signature. No login required for the client.

**Status flow:** Draft → Sent → Accepted / Declined → Invoiced

### 2. Invoicing & Payments
Contractor creates an invoice (from an accepted quote or from scratch). Clicks Send → client gets an email with a Stripe payment link. Client pays by card, Apple Pay, or Google Pay. Money goes directly to the contractor's connected Stripe account. Invoice automatically marked Paid when payment settles.

**Status flow:** Draft → Sent → Paid / Overdue

### 3. Project Status
Every job gets a project record that moves through stages. Contractor sees a live view of all jobs and where they stand. Status updates manually or automatically (quote accepted → In Progress; invoice paid → Paid).

**Status flow:** Lead → Quoted → In Progress → Complete → Invoiced → Paid

### 4. Client Organizer
A searchable list of every client with their contact info, notes, and a full history of their quotes, invoices, and projects. Auto-linked when creating quotes or invoices.

---

## Website Service (Separate Revenue — No Code Needed)

Brian's team builds and hosts a 1-page contractor website as a separate paid service. Not inside the app.

- **What it is:** A clean, professional 1-page site (services, contact info, booking link)
- **Who builds it:** Brian manually (simple HTML/CSS or Next.js page on a subdomain)
- **Revenue model:** One-time build fee + monthly hosting retainer
- **Process:** Contractor contacts us → Brian builds → hosts it → invoices separately via Stripe
- **No app code required** — this is a manual service until volume demands automation

---

## What Is Already Built & Live

### Marketing Site (complete)
- `/` — landing page: hero, pricing (Pro + website add-on), 4-feature grid, footer CTA
- `/pricing` — Pro card + website add-on card, FAQ section
- `/contact` — website inquiry form (name, email, trade, message) → sends to Brian via Resend
- `/sign-up` — onboarding form (name, email, trade, password) — fully wired, creates Stripe trial + Supabase user
- `/login` — login form — fully wired with session cookies
- `components/Nav.tsx` — sticky nav with logo, Features, Pricing, Log in, Try free
- `components/Footer.tsx` — footer with links and copyright

### Auth & Onboarding (complete)
- `app/api/onboard/route.ts` — creates Supabase auth user → Stripe customer → 30-day trial subscription → inserts profile → sends welcome email → sets session cookie → returns JSON
- `app/api/auth/login/route.ts` — signs in with email/password, sets session cookie
- `app/api/auth/logout/route.ts` — clears session, redirects to /login
- `middleware.ts` — protects all `/dashboard/*` routes, redirects unauthenticated users to /login

### Supabase Database (complete)
All 5 tables created and live with Row Level Security enabled:
- `profiles` — extends auth.users; includes first_name, last_name, trade, stripe_customer_id, stripe_subscription_id, stripe_connect_account_id, stripe_connect_onboarded, subscription_status, trial_ends_at, **logo_url**
- `clients` — name, email, phone, address, notes, user_id
- `projects` — name, status, start_date, end_date, notes, client_id, user_id
- `quotes` — quote_number, status, line_items (JSONB), tax_rate, subtotal, total, notes, expires_at, sent_at, accepted_at, accepted_name, client_id, project_id, user_id
- `invoices` — invoice_number, status, line_items (JSONB), tax_rate, subtotal, total, due_date, stripe_payment_link, stripe_payment_intent_id, sent_at, paid_at, client_id, project_id, quote_id, user_id

RLS policy on all tables: `auth.uid() = user_id` (or `id` for profiles)

### Supabase Storage (complete)
- Bucket `logos` created, set to **public**
- Used for contractor logo uploads

### Stripe (complete)
- TradeDesk Pro product + price created ($97/mo recurring)
- STRIPE_PRO_PRICE_ID set in Vercel env vars
- Stripe Connect Express enabled
- Redirect URL set to `https://tradedesk-dun.vercel.app/api/stripe/connect/callback`
- `app/api/stripe/connect/route.ts` — initiates Stripe Connect OAuth
- `app/api/stripe/connect/callback/route.ts` — handles OAuth return, stores connect account ID

### Resend (complete)
- API key set in Vercel env vars
- `lib/resend.ts` — lazy-init Resend client + `sendEmail(to, subject, html)` helper
- `RESEND_FROM_EMAIL` configured (currently using onboarding@resend.dev — needs verified domain before launch)
- Welcome email sent on sign-up (non-blocking)

### Dashboard — Forms (complete)
All four "create new" forms are fully built and wired to their API routes:
- `app/dashboard/clients/new/page.tsx` — name, email, phone, address, notes
- `app/dashboard/projects/new/page.tsx` — name, client dropdown, status, start/end dates, notes
- `app/dashboard/quotes/new/page.tsx` — client dropdown, line item builder, tax rate, totals, notes, expiry date; "Save draft" and "Save & send" buttons
- `app/dashboard/invoices/new/page.tsx` — "from accepted quote" dropdown pre-fills items + tax; client dropdown; due date, line items, notes

### Dashboard — Settings (complete)
- `app/dashboard/settings/page.tsx` — logo upload UI with preview, replace, and remove
- `app/api/logo/route.ts` — POST uploads to Supabase Storage `logos/[userId]/logo.[ext]`, updates profiles.logo_url; DELETE removes logo
- `app/api/profile/route.ts` — GET returns profile fields including logo_url

### API Routes (complete)
All routes live under `app/api/`:

| Route | Methods | Status |
|---|---|---|
| `/api/onboard` | POST | Complete |
| `/api/auth/login` | POST | Complete |
| `/api/auth/logout` | GET | Complete |
| `/api/profile` | GET | Complete |
| `/api/logo` | POST, DELETE | Complete |
| `/api/clients` | GET, POST | Complete |
| `/api/clients/[id]` | GET, PUT, DELETE | Complete |
| `/api/projects` | GET, POST | Complete |
| `/api/projects/[id]` | GET, PUT, DELETE | Complete |
| `/api/quotes` | GET, POST | Complete |
| `/api/quotes/[id]` | GET, PUT, DELETE | Complete |
| `/api/quotes/[id]/send` | POST | Complete |
| `/api/quotes/[id]/accept` | POST (public) | Complete |
| `/api/quotes/[id]/public` | GET (public) | Complete |
| `/api/invoices` | GET, POST | Complete |
| `/api/invoices/[id]` | GET, PUT | Complete |
| `/api/invoices/[id]/send` | POST | Complete |
| `/api/stripe/connect` | GET | Complete |
| `/api/stripe/connect/callback` | GET | Complete |
| `/api/webhooks/stripe` | POST | Partial — needs checkout.session.completed handler |
| `/api/cron/trial-emails` | GET | Stub — logic needs implementing |
| `/api/cron/invoice-reminders` | GET | Stub — logic needs implementing |
| `/api/contact` | POST | Complete |

### Utilities (complete)
- `lib/supabase.ts` — browser client, server client (cookie-based), admin client (service role)
- `lib/stripe.ts` — lazy-init Stripe client via Proxy (avoids build-time crash)
- `lib/resend.ts` — lazy-init Resend + sendEmail helper
- `middleware.ts` — protects /dashboard/* routes
- `vercel.json` — cron schedule for trial emails + invoice reminders
- `types/index.ts` — TypeScript interfaces (Profile, Client, Project, Quote, Invoice, LineItem)

---

## What Still Needs Building

### HIGH PRIORITY (required before first paying customer)

- [ ] **Dashboard list pages** — quotes, invoices, projects, clients list views with real data from API
- [ ] **Dashboard detail pages** — quote/[id], invoice/[id], project/[id], client/[id] full detail views
- [ ] **Public quote page** (`/quotes/[id]`) — client-facing acceptance page with logo, line items, signature field
- [ ] **Logo on quotes/invoices** — show profile logo_url on the public quote page and in invoice emails
- [ ] **Stripe webhook handler** — handle `checkout.session.completed` to mark invoices paid
- [ ] **Invoice send flow** — create Stripe Payment Link, email client, update status
- [ ] **Trial email cron** — implement query logic in `/api/cron/trial-emails`
- [ ] **Invoice reminder cron** — implement query logic in `/api/cron/invoice-reminders`
- [ ] **Verified sending domain** — verify a real domain in Resend (RESEND_FROM_EMAIL can't stay as onboarding@resend.dev)

### BEFORE LAUNCH CHECKLIST
- [ ] Resend verified domain set in env vars
- [ ] Stripe webhook endpoint registered and STRIPE_WEBHOOK_SECRET in Vercel
- [ ] Test full sign-up → trial → payment flow end-to-end
- [ ] Test quote creation → send → client acceptance flow end-to-end
- [ ] Test invoice creation → send → client payment flow end-to-end

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

## First Clients (Do This Now, In Parallel With Building)

1. Identify 20–30 contractors you already know personally
2. Personal message: "I built something to handle your admin. Quotes, invoices, client tracking — one place. Want to try it free for a month?"
3. Offer 3–5 as beta testers at no cost — get feedback before you charge
4. After week 1: ask each for one referral
5. For website add-on: offer to build their site as part of the beta deal — you build it, they pay hosting when you launch

---

## Running the Dev Server

`.env.local` is intentionally empty — all real keys live in Vercel. Before running locally, pull them down first:

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
npx vercel env pull .env.local
npm run dev -- --port 4000
```

Site: http://localhost:4000
Ports 3000, 3001, 3002 are taken by other projects.

**Note:** `vercel env pull` pulls live keys. Sign-ups locally will create real Stripe trial customers (no charge for 30 days). To test with fake data, swap to Stripe test keys (`sk_test_...`) after pulling.

**Known warning (not an error):** `The "middleware" file convention is deprecated. Please use "proxy" instead.` — harmless, Next.js 16 thing, doesn't affect functionality.

## Build

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
npm run build
```

Last clean build: 2026-05-26. All 34 routes compiled, no errors.

## Deployment

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
npx vercel --prod --yes
```

Production: https://tradedesk-dun.vercel.app
