# TradeDesk — Project Overview & Build Checklist

## What This Is

TradeDesk is a focused SaaS platform for solo contractors (any trade). It replaces scattered Word docs, spreadsheets, and mental load with four tools in one place: quote builder, invoicing with online payments, project status tracking, and a client organizer.

**Brand promise:** "The admin you never had."
**Price:** $97/mo · First month free · No contracts
**Design spec:** `docs/design-spec.md`
**Dev server:** `npm run dev -- --port 4000` → http://localhost:4000

---

## Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Frontend | Next.js 15 + Tailwind CSS | Marketing site + contractor dashboard |
| Hosting | Vercel | Deploy and serve the app |
| Database | Supabase (Postgres) | All app data — users, clients, quotes, invoices, projects |
| Auth | Supabase Auth | Email/password sign-in |
| File storage | Supabase Storage | Quote/invoice attachments |
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

## What Is Already Built

### Marketing Site (complete)
- `/` — landing page: hero, pricing (Pro + website add-on), 4-feature grid, footer CTA
- `/pricing` — Pro card + website add-on card, FAQ section
- `/sign-up` — onboarding form (name, email, trade, password)
- `/login` — login form
- `components/Nav.tsx` — sticky nav with logo, Features, Pricing, Log in, Try free
- `components/Footer.tsx` — footer with links and copyright

### App Shell (stubs — UI exists, logic not wired up)
- `app/dashboard/layout.tsx` — sidebar nav shell
- `app/dashboard/page.tsx` — overview with quick actions + Stripe Connect banner
- `app/dashboard/quotes/` — list, new, detail pages (stubs)
- `app/dashboard/invoices/` — list, new, detail pages (stubs)
- `app/dashboard/projects/` — list, new, detail pages (stubs)
- `app/dashboard/clients/` — list, new, detail pages (stubs)
- `app/quotes/[id]/page.tsx` — public client quote acceptance page (stub)

### API Routes (stubs — files exist, logic not implemented)
- All routes under `app/api/` exist with correct HTTP methods and TODO comments

### Utilities (complete)
- `lib/supabase.ts` — Supabase client
- `lib/stripe.ts` — Stripe client
- `lib/resend.ts` — Resend client + sendEmail helper
- `middleware.ts` — protects `/dashboard/*` routes
- `vercel.json` — cron schedule for trial emails + invoice reminders
- `types/index.ts` — all TypeScript interfaces (Profile, Client, Project, Quote, Invoice)

### Project Config (complete)
- Next.js 15 + Tailwind CSS + TypeScript scaffolded
- ESLint configured
- Packages installed: `@supabase/supabase-js`, `stripe`, `resend`
- GitHub: https://github.com/bluepenguin1234/tradedesk

---

## Full Build Checklist

Work through phases in order. Each phase depends on the previous.

---

### PHASE 1A — Environment Setup

- [ ] Create `.env.local` in project root with all variables below
- [ ] Create Supabase project at supabase.com → copy URL and anon key
- [ ] Create Stripe account at stripe.com → copy secret key and publishable key
- [ ] Create Resend account at resend.com → get API key → verify your sending domain
- [ ] Connect GitHub repo to Vercel → add all env vars to Vercel dashboard → deploy
- [ ] Confirm site loads at Vercel production URL

**`.env.local` template:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@tradedesk.com

NEXT_PUBLIC_APP_URL=http://localhost:4000
```

---

### PHASE 1B — Supabase Database Schema

Run all SQL below in the Supabase SQL editor. Tables must exist before any backend code is written.

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  first_name text,
  last_name text,
  trade text,
  business_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_connect_account_id text,
  stripe_connect_onboarded boolean default false,
  subscription_status text default 'trialing',
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- Clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  status text default 'lead',
  -- status options: lead | quoted | in_progress | complete | invoiced | paid
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz default now()
);

-- Quotes
create table quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  quote_number text,           -- format: QT-YYYY-NNN
  status text default 'draft', -- draft | sent | accepted | declined | invoiced
  line_items jsonb default '[]',
  -- line_items format: [{ description, qty, unit_price }]
  tax_rate numeric default 0,
  subtotal numeric default 0,
  total numeric default 0,
  notes text,
  expires_at date,
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_name text,          -- client's typed signature
  created_at timestamptz default now()
);

-- Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  invoice_number text,         -- format: INV-YYYY-NNN
  status text default 'draft', -- draft | sent | paid | overdue
  line_items jsonb default '[]',
  tax_rate numeric default 0,
  subtotal numeric default 0,
  total numeric default 0,
  due_date date,
  stripe_payment_link text,
  stripe_payment_intent_id text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);
```

**Enable Row Level Security on all tables:**
```sql
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table quotes enable row level security;
alter table invoices enable row level security;

create policy "own rows" on profiles for all using (auth.uid() = id);
create policy "own rows" on clients for all using (auth.uid() = user_id);
create policy "own rows" on projects for all using (auth.uid() = user_id);
create policy "own rows" on quotes for all using (auth.uid() = user_id);
create policy "own rows" on invoices for all using (auth.uid() = user_id);
```

**Checklist:**
- [ ] Run schema SQL in Supabase SQL editor
- [ ] Confirm all 5 tables exist with correct columns
- [ ] Confirm RLS enabled and policies created on all 5 tables
- [x] `lib/supabase.ts` — exists (basic client, may need server variant for middleware)

---

### PHASE 1C — Stripe Setup (Subscriptions)

**How contractor billing works:**
Contractor signs up → Stripe customer created → Pro subscription with 30-day trial starts → on day 31, Stripe charges $97/mo automatically → Stripe sends webhook → TradeDesk updates `subscription_status` in Supabase.

**Steps:**
- [ ] Create product in Stripe dashboard: "TradeDesk Pro" at $97/mo recurring
- [ ] Copy Price ID → `STRIPE_PRO_PRICE_ID` in `.env.local`
- [ ] Create webhook endpoint in Stripe: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Set webhook to listen for: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`
- [x] `lib/stripe.ts` — exists
- [x] `app/api/webhooks/stripe/route.ts` — stub exists, logic needs implementing

**Webhook handler logic:**
- `customer.subscription.updated` → update `subscription_status` in `profiles`
- `customer.subscription.deleted` → set `subscription_status = 'cancelled'`
- `invoice.payment_succeeded` (subscription) → set `subscription_status = 'active'`
- `invoice.payment_failed` → set `subscription_status = 'past_due'`, send Resend email

---

### PHASE 1D — Stripe Connect (Invoice Payments to Contractors)

**How it works:**
Each contractor connects their own Stripe account. When they send an invoice, TradeDesk creates a Payment Link on their connected account. Client pays → money goes directly to the contractor's bank. Stripe takes 2.9% + 30¢ per transaction; TradeDesk takes nothing.

**One-time setup in Stripe dashboard:**
- [ ] Enable Stripe Connect in your Stripe account settings
- [ ] Set platform type to "Express"
- [ ] Add redirect URL: `https://yourdomain.com/api/stripe/connect/callback`

**Files to create:**
- [x] `app/api/stripe/connect/route.ts` — stub exists, logic needs implementing
- [x] `app/api/stripe/connect/callback/route.ts` — stub exists, logic needs implementing
- [x] Dashboard banner — already shown on `app/dashboard/page.tsx` (stub)

---

### PHASE 1E — Auth + Onboarding

**Sign-up flow (step by step):**
1. Contractor fills `/sign-up` (first name, last name, email, trade, password)
2. Form POSTs to `POST /api/onboard`
3. API validates all fields present
4. API calls `supabase.auth.admin.createUser({ email, password })`
5. API calls `stripe.customers.create({ email, name, metadata: { supabase_id } })`
6. API calls `stripe.subscriptions.create({ customer, items: [{ price: STRIPE_PRO_PRICE_ID }], trial_period_days: 30 })`
7. API inserts into `profiles` table (id = Supabase user id, stripe_customer_id, trial_ends_at = now + 30 days)
8. API sends welcome email via Resend
9. API sets Supabase session cookie
10. Redirect to `/dashboard`

**Files to create:**
- [x] `app/api/onboard/route.ts` — stub exists, logic needs implementing
- [x] `middleware.ts` — stub exists (needs Supabase session check wired up)
- [x] `app/login/page.tsx` — UI complete
- [x] `app/api/auth/login/route.ts` — stub exists, logic needs implementing
- [x] `app/api/auth/logout/route.ts` — stub exists, logic needs implementing
- [x] `app/dashboard/layout.tsx` — sidebar shell complete

**Sidebar nav links:**
- `/dashboard` — Overview
- `/dashboard/clients` — Clients
- `/dashboard/quotes` — Quotes
- `/dashboard/invoices` — Invoices
- `/dashboard/projects` — Projects

---

### PHASE 1F — Trial Email Sequences (Resend)

**How it works:**
A daily cron job (Vercel Cron) queries Supabase for contractors at specific trial milestones and sends the correct email via Resend.

**Emails to build:**

| Trigger | Subject | Purpose |
|---|---|---|
| Sign-up (day 0) | "You're in. Here's how to get started." | Welcome + quick-start guide |
| Day 7 | "How's it going?" | Check-in, remind them to connect Stripe |
| Day 25 | "Your free month ends in 5 days." | Urgency, highlight what they've set up |
| Day 28 | "2 days left on your trial." | Last push before charge |
| Day 31 — converted | "Welcome to Pro." | Confirm they're now paying |
| Day 31 — cancelled | "Your trial ended." | Offer to come back, no pressure |
| Quote accepted | "[Client] accepted your quote." | Notify contractor immediately |
| Invoice paid | "[Client] paid invoice #NNN." | Notify contractor immediately |
| Invoice overdue | "Invoice #NNN is overdue." | Sent to client (not contractor) on due date + 1 |

**Files to create:**
- [x] `lib/resend.ts` — exists with sendEmail helper
- [x] `app/api/cron/trial-emails/route.ts` — stub exists, query logic needs implementing
- [x] `vercel.json` — cron schedule already configured:
```json
{
  "crons": [
    { "path": "/api/cron/trial-emails", "schedule": "0 9 * * *" },
    { "path": "/api/cron/invoice-reminders", "schedule": "0 9 * * *" }
  ]
}
```
- [ ] Cron endpoints must verify `Authorization: Bearer [CRON_SECRET]` header to prevent public access
- [ ] Add `CRON_SECRET` to `.env.local` and Vercel env vars

---

### PHASE 2A — Quote Builder

**What to build:**

- [ ] `app/dashboard/quotes/page.tsx`
  - List of all quotes, filterable by status tab (All / Draft / Sent / Accepted / Declined)
  - Each row: quote number, client name, job description, total, status badge, date sent
  - "New Quote" button top right

- [ ] `app/dashboard/quotes/new/page.tsx`
  - Select client (dropdown from existing clients) or type new client name (creates client on submit)
  - Job description field (text)
  - Line items builder: table with rows of [Description | Qty | Unit Price | Row Total]; "Add line item" button adds a row; trash icon removes
  - Tax rate (% input, defaults to 0)
  - Subtotal and Total auto-calculated and displayed
  - Expiry date picker
  - Notes (optional textarea)
  - Buttons: "Save Draft" and "Send Quote" (sends immediately)

- [ ] `app/dashboard/quotes/[id]/page.tsx`
  - Full quote detail: all fields read-only with edit mode toggle
  - Status badge with color coding
  - "Send Quote" button (if draft) → calls send API
  - "Convert to Invoice" button (if accepted) → pre-fills invoice form with same line items
  - Link to client record

- [ ] `app/quotes/[id]/page.tsx` — **PUBLIC, no auth required**
  - Shows: contractor name and trade, job description, itemized line items, tax, total, expiry date
  - "Accept this Quote" button → modal overlay with typed name field → submit calls accept API
  - After acceptance: shows confirmation message ("Quote accepted. [Contractor] will be in touch.")
  - If already accepted: shows accepted state with signature name and date

- [ ] `app/api/quotes/route.ts` — GET (list for authenticated user), POST (create new quote, auto-generate quote number)
- [ ] `app/api/quotes/[id]/route.ts` — GET, PUT (update fields/status), DELETE
- [ ] `app/api/quotes/[id]/send/route.ts` — POST: set `status = sent`, `sent_at = now()`, send email to client via Resend with quote link
- [ ] `app/api/quotes/[id]/accept/route.ts` — POST (public, no auth): validate `accepted_name` not empty, set `status = accepted`, `accepted_at = now()`, `accepted_name`; if linked project exists, update project `status = in_progress`; send "quote accepted" notification to contractor via Resend

**Quote number generation:** Query `count(*)` of user's existing quotes + 1, format as `QT-${year}-${String(n).padStart(3, '0')}`

---

### PHASE 2B — Invoicing & Payments

**What to build:**

- [ ] `app/dashboard/invoices/page.tsx`
  - List of invoices with status tabs (All / Draft / Sent / Paid / Overdue)
  - Outstanding total prominently shown (sum of all sent + overdue invoices)
  - Each row: invoice number, client, total, due date, status badge, payment link indicator
  - "New Invoice" button top right

- [ ] `app/dashboard/invoices/new/page.tsx`
  - Option A: "From quote" — dropdown of accepted quotes, pre-fills all fields
  - Option B: From scratch — same line item builder as quotes
  - Due date picker
  - Tax rate
  - Notes

- [ ] `app/dashboard/invoices/[id]/page.tsx`
  - Full invoice detail with status badge
  - "Send Invoice" button (if draft and Stripe connected) → creates Payment Link, sends email, status → sent
  - Stripe Connect prompt if not yet connected
  - "Mark as Paid" manual override (for cash payments)
  - Stripe payment link displayed with copy button

- [ ] `app/api/invoices/route.ts` — GET, POST (auto-generate invoice number)
- [ ] `app/api/invoices/[id]/route.ts` — GET, PUT
- [ ] `app/api/invoices/[id]/send/route.ts` — POST:
  1. Fetch contractor's `stripe_connect_account_id` from `profiles`
  2. Create Stripe Payment Link: `stripe.paymentLinks.create({ line_items, on_behalf_of: connect_account_id })`
  3. Store link in `invoices.stripe_payment_link`
  4. Set `status = sent`, `sent_at = now()`
  5. Send invoice email to client via Resend with payment link

- [ ] Extend `app/api/webhooks/stripe/route.ts` to handle `checkout.session.completed`:
  - Find invoice by `stripe_payment_intent_id`
  - Set `status = paid`, `paid_at = now()`
  - If linked project: set project `status = paid`
  - Send "invoice paid" notification to contractor via Resend

- [ ] `app/api/cron/invoice-reminders/route.ts` — daily cron:
  - Find invoices where `due_date < today` and `status = sent` → set `status = overdue`, send reminder email to client
  - Find invoices where `due_date = today` → send "payment due today" email to client
  - Find invoices 3 days before due → send "payment due soon" email to client

**Invoice email to client:**
```
Subject: Invoice from [Contractor Name] — $[Total] due [Date]
Body: "Hi [Client], please find your invoice for [Job]. Pay securely here: [Stripe link]"
```

---

### PHASE 2C — Project Status

**What to build:**

- [ ] `app/dashboard/projects/page.tsx`
  - Two views: List view (default) and Kanban view (toggle)
  - **List view:** rows with project name, client, status badge, last updated date, linked quote/invoice indicators
  - **Kanban view:** columns for each status (Lead / Quoted / In Progress / Complete / Invoiced / Paid), each card shows project name + client name + amount
  - Status filter tabs at top
  - "New Project" button

- [ ] `app/dashboard/projects/new/page.tsx`
  - Fields: project name, select client, initial status, start date, end date (optional), notes
  - Optionally link to existing quote

- [ ] `app/dashboard/projects/[id]/page.tsx`
  - Status selector (dropdown or segmented control) — changing status updates immediately
  - Client name (link to client record)
  - Linked quote (if any) — shows quote number + status + link
  - Linked invoice (if any) — shows invoice number + status + amount + link
  - Notes textarea (auto-saves)
  - Activity log: chronological list of status changes with timestamps (store in a `project_activity` JSONB column or separate table)

- [ ] `app/api/projects/route.ts` — GET (list for user, with optional status filter), POST (create)
- [ ] `app/api/projects/[id]/route.ts` — GET, PUT (update status, notes, dates), DELETE

**Status auto-update hooks (add to quote/invoice APIs):**
- When quote accepted → find linked project → set `status = in_progress`
- When invoice created from quote → find linked project → set `status = invoiced`
- When invoice paid → find linked project → set `status = paid`

---

### PHASE 2D — Client Organizer

**What to build:**

- [ ] `app/dashboard/clients/page.tsx`
  - Search bar (filters by name, email, phone in real time)
  - Client list: name, trade/industry, outstanding amounts, last activity date
  - "New Client" button top right
  - Each row links to client detail page

- [ ] `app/dashboard/clients/new/page.tsx`
  - Fields: name (required), email, phone, address, notes
  - Submit → create client → redirect to client detail

- [ ] `app/dashboard/clients/[id]/page.tsx`
  - Contact info section with inline edit (click to edit any field)
  - Tabbed sections:
    - **Quotes** — all quotes for this client, with status and amounts
    - **Invoices** — all invoices, with status, amounts, payment link
    - **Projects** — all projects linked to this client
    - **Notes** — free-text notes, auto-saved
  - "New Quote" shortcut pre-fills this client
  - "New Invoice" shortcut pre-fills this client
  - "New Project" shortcut pre-fills this client

- [ ] `app/api/clients/route.ts` — GET (list with optional `search` query param), POST
- [ ] `app/api/clients/[id]/route.ts` — GET (with all linked quotes/invoices/projects), PUT, DELETE

**Auto-link logic:**
When creating a quote or invoice: if contractor types a client name that already exists in their client list → auto-link by ID. If new name → offer "Create new client" inline and link the newly created record.

---

### PHASE 2E — Dashboard Overview

**What to build:**

- [ ] `app/dashboard/page.tsx` — first screen after login

**Widgets to show:**
- **Stripe Connect banner** (if not connected): full-width yellow/amber bar — "Connect Stripe to start collecting payments →"
- **Project status summary:** row of colored chips showing count per status (e.g., "3 In Progress · 2 Invoiced · 1 Lead")
- **Outstanding invoices:** total $ amount unpaid + list of 3 oldest unpaid invoices with client name, amount, days overdue
- **Quotes awaiting response:** list of sent quotes with no response, days since sent
- **Quick actions:** 4 large cards — "New Quote", "New Invoice", "Add Client", "New Project"
- **Recent activity:** last 10 status changes across all records (quote sent, invoice paid, project updated, etc.)

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

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
npm run dev -- --port 4000
```

Site: http://localhost:4000
Ports 3000, 3001, 3002 are taken by other projects (IdeaForge, Big Brain).
