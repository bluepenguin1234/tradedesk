# TradeDesk — Design Spec
**Date:** 2026-05-25  
**Status:** Approved

---

## Context

Small contractors (under 10 employees, any trade) spend significant time every day on administrative work — managing their inbox, building quotes in Word, chasing invoice payments, and keeping track of clients scattered across texts and sticky notes. They didn't start their businesses to do paperwork, but without staff or systems, the admin pile never shrinks.

TradeDesk is a white-labeled SaaS platform that gives these contractors all the admin tools they need in one place — email CRM, AI-assisted replies, quoting, invoicing, scheduling, and a business website. Contractors who want more help can upgrade to a Done-For-You tier where Brian's team manages the admin on their behalf.

The brand promise: **"The admin you never had."**

---

## Target Market

- **Who:** Independent contractors and small trades businesses, any trade, under 10 employees
- **Pain points:** Disorganized inbox, manual quoting, scattered client info, no time for admin
- **Not targeting:** Enterprise contractors, large GCs, property management companies

---

## Platform Architecture

TradeDesk is built on **GoHighLevel (GHL)** white-labeled as "TradeDesk." Contractors never see GoHighLevel — they only interact with the TradeDesk brand.

| Layer | What It Is | Who Builds/Configures It |
|---|---|---|
| TradeDesk brand | White-labeled GHL agency dashboard | Configure in GHL |
| Marketing site | Public-facing landing page + pricing + sign-up | Build (Next.js) |
| Onboarding flow | Sign up → Stripe billing → GHL sub-account provisioned | Build (GHL API + Stripe) |
| TradeDesk Snapshot | Pre-configured pipelines, templates, automations | Configure in GHL |
| Contractor workspace | GHL sub-account per contractor | Auto-provisioned |
| DFY service | Brian's team accesses contractor sub-account | Operational process |

**GHL agency plan:** ~$497/mo, covers unlimited sub-accounts. Break-even = 6 Pro subscribers.

---

## Product Tiers

### Pro — $29/mo + 0.5% transaction fee · First month free
Main revenue driver. Card required at sign-up, not charged until month 2. Trial gives contractors full access — no artificial limits to work around.

- Unlimited contacts and CRM
- Unlimited quotes + invoices
- AI email drafting and reply suggestions
- Automated follow-up sequences
- Lead pipeline tracking
- 1-page business website
- Stripe payment collection on invoices
- Online booking calendar
- Review request automation

### Done-For-You — $397/mo · First month free
High-margin managed service. Cap at 15–20 clients initially. Intake via booking link + qualification form before access is granted.

- Everything in Pro
- Brian's team manages the GHL account on their behalf
- Inbox monitored, replies drafted and sent
- Quotes sent on contractor's behalf
- Monthly 30-minute strategy call
- Full account setup included
- Lead gen campaign setup
- Priority support

**DFY intake flow:** Contractor clicks "Learn about Done-For-You" → fills out intake form (trade type, team size, biggest admin pain point) → books a 20-minute onboarding call via Calendly → Brian's team sets up their account and takes over within 48 hours.

### Revenue Benchmarks
| Mix | Monthly Revenue |
|---|---|
| GHL cost | -$497 |
| Break even (Pro only) | 6 subscribers |
| 50 Pro + 10 DFY | ~$8,820/mo |
| 100 Pro + 20 DFY | ~$17,443/mo |

---

## Feature Set (GHL Handles — Already Built)

All of the following are native GHL features, configured not built:

- **Email CRM** — unified inbox, contact management, conversation history
- **AI Email Assistant** — drafts replies using GHL's built-in AI
- **Automated follow-up sequences** — triggers on quote sent, job closed, invoice unpaid
- **Quote builder** — professional templates, client e-signature
- **Invoicing** — online payment via Stripe, auto payment reminders
- **Calendar & online booking** — client self-scheduling, syncs with Google Calendar
- **Lead pipeline** — Kanban-style deal tracking
- **Website builder** — 1-page contractor sites
- **Review requests** — auto-sends Google review links after job close
- **SMS / calls** — two-way messaging via GHL's phone system

---

## Marketing Site Design

**Headline:** The admin you never had.

**Subheadline:** Emails, quotes, invoices, and client info — all in one place, all handled for you. So you can get back to the work you actually started your business for.

**Structure:**
1. Nav — TradeDesk logo, Features / Pricing / How it works, Log in, Try Free CTA
2. Hero — headline, subheadline, dual CTA (Try Free for 30 Days / See how it works)
3. Pain points — 3 relatable contractor quotes about inbox chaos, manual quoting, scattered info
4. Value banner — "One login. Every tool your business needs."
5. Features grid — 6 features, busywork-relief framing
6. DFY callout — "Rather have someone else handle it? We'll run it for you."
7. Footer CTA — "The admin you never had — starting today."

**Visual direction:** Navy/dark blue theme (#0d1528 base, #4f8ef7 accent), bold sans-serif type, professional but approachable tone for trades audience.

**Tech:** Next.js hosted on Vercel. Static pages for marketing content; Next.js API routes handle the sign-up → Stripe → GHL sub-account provisioning flow server-side.

---

## Build Phases

### Phase 1 — MVP (Weeks 1–6)
Goal: First paying customer.

**What gets built:**
1. **Marketing website** — landing page, features, pricing, sign-up CTA
2. **Contractor onboarding flow** — sign-up form → Stripe billing → GHL sub-account auto-provisioned via GHL API
3. **TradeDesk GHL Snapshot** — pre-configured pipelines, email templates, quote templates, follow-up sequences, white-label branding

**What gets configured in GHL:**
- White-label: TradeDesk branding throughout, including mobile app (GHL white-label app available on iOS + Android — branded as TradeDesk so contractors can manage their inbox and quotes from job sites)
- SaaS mode: subscription tiers wired to Stripe, 30-day trial period configured natively in GHL
- AI email assistant enabled for all trial and paid accounts
- Trial conversion sequence: automated emails at day 7 (usage check-in + tips), day 25 (trial ending in 5 days), day 28 (last chance + highlight top features used), day 31 (welcome to Pro or cancellation confirmation)
- Cancellation handling: sub-account archived (not deleted) for 60 days on cancellation — data preserved if contractor returns; auto-deleted after 60 days

**End state:** TradeDesk is live. Contractors can sign up, get a working workspace, and Brian can manually onboard the first DFY clients.

### Phase 2 — Growth (Weeks 7–14)
Goal: 20+ paying subscribers.

- Trade-specific website templates (plumber, electrician, HVAC, landscaper, painter)
- Review request automation sequence
- Referral program via GHL affiliate tracking

### Phase 3 — Scale (Month 4+)
Goal: 50+ subscribers, systematize DFY.

- Simplified contractor dashboard (custom portal layer on GHL for less tech-savvy users)
- Lead gen marketplace (sell verified local leads as add-on)
- DFY SOPs + VA hiring to scale managed service beyond 20 clients

---

## First Customer Acquisition

The marketing site won't rank on day one. The fastest path to first paying customers is Brian's existing contractor relationships — no ads, no SEO, no cold outreach needed yet.

**Phase 1 acquisition plan:**
1. **Direct outreach** — identify 20–30 contractors Brian already knows. Send a personal message: "I built something to handle the admin side of your business. Want to try it free for a month?" No pitch deck, no demo — just a link and a personal note.
2. **DFY first** — offer the first 3–5 as Done-For-You at no cost for 30 days in exchange for honest feedback and a testimonial. This fills the "Trusted by X contractors" social proof gap and stress-tests the managed service process before scaling it.
3. **Referral ask** — after a contractor's first week, ask them to refer one other contractor they know who has the same problem. Word of mouth in trades is strong.

**Phase 2 acquisition** (once the product is validated): Google/Meta ads targeting local service businesses, trade association forums, Reddit (r/Contractor, r/smallbusiness), and the GHL referral program.

---

## Verification

**Phase 1 is done when:**
- [ ] Marketing site live at tradedesk.com (or staging URL)
- [ ] Contractor can sign up, enter card, and land in a fully functional GHL workspace within 5 minutes
- [ ] 30-day trial fires correctly — card not charged until day 31
- [ ] Full Pro feature set available during trial (no artificial limits)
- [ ] Brian can access any contractor sub-account for DFY management
- [ ] GHL white-label complete — no GoHighLevel branding visible to contractors
- [ ] TradeDesk mobile app configured and downloadable (white-labeled GHL app)
- [ ] Trial conversion email sequence fires correctly at days 7, 25, 28, and 31
- [ ] Cancelled sub-accounts archive (not delete) and persist for 60 days
- [ ] DFY intake form + Calendly booking link live and linked from marketing site
