# TradeDesk

> The admin you never had. Built for contractors.

Quotes, invoices, project tracking, and client info — all in one place. $97/mo, first month free.

## Stack

- **Next.js 15** (App Router) + Tailwind CSS
- **Supabase** — Postgres database + auth
- **Stripe** — subscriptions + Stripe Connect for invoice payments
- **Resend** — transactional email
- **Vercel** — hosting + cron jobs

## Dev Server

```bash
npm run dev -- --port 4000
```

→ http://localhost:4000

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── pricing/                  # Pricing page
├── sign-up/                  # Sign-up form
├── login/                    # Login form
├── quotes/[id]/              # Public client quote acceptance page
├── dashboard/                # Contractor app (auth-protected)
│   ├── layout.tsx            # Sidebar shell
│   ├── page.tsx              # Overview
│   ├── quotes/               # Quote builder
│   ├── invoices/             # Invoicing & payments
│   ├── projects/             # Project status tracker
│   └── clients/              # Client organizer
└── api/
    ├── onboard/              # Sign-up → Stripe → Supabase
    ├── auth/                 # Login / logout
    ├── stripe/connect/       # Stripe Connect onboarding
    ├── webhooks/stripe/      # Stripe webhook handler
    ├── quotes/               # Quote CRUD + send + accept
    ├── invoices/             # Invoice CRUD + send
    ├── clients/              # Client CRUD
    ├── projects/             # Project CRUD
    └── cron/                 # Trial email + invoice reminder crons

components/     # Nav, Footer
lib/            # supabase.ts, stripe.ts, resend.ts
docs/           # Design spec
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your keys. See `CLAUDE.md` for the full setup checklist.

## Build Checklist

See `CLAUDE.md` for the complete phase-by-phase build guide.
