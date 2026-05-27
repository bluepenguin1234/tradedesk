# TradeDesk

> The admin you never had. Built for contractors.

Quotes, invoices, project tracking, and client info — all in one place. $29/mo + 0.5% on payments, first month free.

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
├── (marketing)/              # Public marketing pages
│   ├── page.tsx              # / — landing page
│   ├── pricing/              # /pricing
│   ├── sign-up/              # /sign-up
│   └── login/               # /login
├── dashboard/                # Contractor app (auth-protected)
│   ├── layout.tsx            # Sidebar shell
│   ├── page.tsx              # /dashboard — overview
│   ├── quotes/               # Quote builder
│   ├── invoices/             # Invoicing & payments
│   ├── projects/             # Project status tracker
│   └── clients/              # Client organizer
├── quotes/[id]/              # /quotes/[id] — public client quote acceptance
├── api/
│   ├── onboard/              # Sign-up → Stripe → Supabase
│   ├── auth/                 # Login / logout
│   ├── stripe/connect/       # Stripe Connect onboarding
│   ├── webhooks/stripe/      # Stripe webhook handler
│   ├── quotes/               # Quote CRUD + send + accept
│   ├── invoices/             # Invoice CRUD + send
│   ├── clients/              # Client CRUD
│   ├── projects/             # Project CRUD
│   └── cron/                 # Trial emails + invoice reminders
├── layout.tsx                # Root layout (fonts, metadata)
├── globals.css
└── favicon.ico

components/                   # Nav, Footer
lib/                          # supabase.ts, stripe.ts, resend.ts
types/                        # Shared TypeScript types
docs/                         # Design spec
```

## Build Checklist

See `CLAUDE.md` for the complete phase-by-phase build guide.
