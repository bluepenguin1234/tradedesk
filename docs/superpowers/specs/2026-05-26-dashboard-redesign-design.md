# Dashboard Redesign — 2026-05-26

## Problem

The current `/dashboard` overview is decorative, not useful. Three stat cards ("Outstanding invoices", "Quotes awaiting response", "Active projects") all show `—` because they're hardcoded placeholders. There is no signal of what the contractor should do when they land. The page is "5-year-old simple" in the wrong way — it tells you nothing.

## Goal

Replace the overview with a focused, action-first layout that answers three questions in order, as soon as the contractor opens the app:

1. **What's the next action I'd take 80% of the time?** → solved by Big Buttons
2. **What's the state of all my work?** → solved by Pipeline
3. **What is the single most important thing I should do today?** → solved by Coach

A contractor with no training should be able to use this. No menu diving, no jargon, no empty stat cards.

## Layout

Three stacked sections inside the existing `/dashboard` route. No sidebar changes, no new routes.

### Section 1 — Greeting + Three Big Buttons

- Greeting line: `"Good morning, {first_name}."` (or "Good afternoon" / "Good evening" depending on hour). Subtitle is today's date.
- Three large tiles in a 3-column grid:
  - **New Quote** — primary (filled green `#15803d`), links to `/dashboard/quotes/new`
  - **New Invoice** — outline, links to `/dashboard/invoices/new`
  - **Add Client** — outline, links to `/dashboard/clients/new`
- Each tile: small circular icon (＋, ＄, ☺), label below, generous padding (~28px vertical), hover lifts to `#f0fdf4` background and `#15803d` border.

### Section 2 — Pipeline

- Section heading: small uppercase `"Pipeline"` label, right-aligned metadata `"{N} jobs · ${total} in flight"`.
- Card containing 5 columns: **Lead**, **Quoted**, **Working**, **Invoiced**, **Paid**.
- Column mapping from `projects.status`:
  | DB status | Column |
  |---|---|
  | `lead` | Lead |
  | `quoted` | Quoted |
  | `in_progress` | Working |
  | `complete` | Working |
  | `invoiced` | Invoiced |
  | `paid` | Paid |
- Column header shows count pill (e.g., `Working 2`).
- Each project card shows:
  - Project name (medium weight)
  - Client name (small, muted)
  - Dollar amount (latest invoice's `total` if `invoiced/paid`; otherwise latest quote's `total`; otherwise blank) — colored green
- Card actions:
  - **Body click** → navigate to `/dashboard/projects/[id]` (existing detail page).
  - **"→" advance button** (small, top-right of card) → PUT `/api/projects/[id]` with `status` = next in pipeline order. No-op when already in `paid`.
  - **Status pill click** (kept inline on card for paid/last-stage indication) → small popover listing all 5 statuses; pick one → PUT with that status. Allows any-to-any moves including backwards.
- Empty columns show `"—"` placeholder text in muted italic.

#### Pipeline order for advance button

`lead → quoted → in_progress → invoiced → paid`

Note: `complete` is reachable only via direct pill edit (it represents "job finished but not yet invoiced"). The advance button skips it because most contractors don't think of "complete" as a step — they go from working straight to invoicing. Pill remains the way to set `complete` deliberately.

#### Auto-transitions (existing API behavior — document, do not change)

| Trigger | API location | Effect |
|---|---|---|
| Quote sent on project | not currently wired | (out of scope; would be a follow-up) |
| Invoice created on project | `app/api/invoices/route.ts:73-75` | project → `invoiced` |
| Invoice marked paid | webhook in `app/api/webhooks/stripe/route.ts` and PUT in `app/api/invoices/[id]/route.ts` | project → `paid` (existing behavior — verify) |

### Section 3 — Coach / Today's Focus

- Section heading: small uppercase `"Today's focus"`, right-aligned metadata `"picked from your data"`.
- One white card, centered text:
  - Single recommendation sentence in serif font (~22px), key nouns/amounts emphasized green-italic.
  - Primary green pill CTA button (`"Send reminder →"`, `"Follow up →"`, etc.) — links to the relevant detail page or triggers the relevant action.
  - Small underlined `"Show me a different focus"` link below — cycles to the next priority.
- Picker logic, in priority order:
  1. **Overdue invoices** — any invoice with `status='sent'` and `due_date < today`. Suggest: send reminder. CTA → invoice detail page.
  2. **Stale sent quotes** — any quote with `status='sent'` and `sent_at < today - 7 days`. Suggest: follow up. CTA → quote detail page.
  3. **Unsent drafts** — any quote or invoice with `status='draft'` older than 1 day. Suggest: send it. CTA → its detail page.
  4. **No active work** — if no projects in `lead/quoted/in_progress/complete`. Suggest: create a quote or add a client. CTA → `/dashboard/quotes/new`.
  5. **Caught up** — none of the above. Suggest a positive message (e.g., `"You're caught up. Everything looks healthy."`). CTA hidden or replaced with a "View this week" link to projects list.
- `"Show me a different focus"` advances through the same-priority list (e.g., second overdue invoice), then drops down to the next category.
- Client-side state for the cycle index — no server round-trip per cycle.

## Data fetching

`app/dashboard/page.tsx` becomes a server component (or stays one). One `Promise.all` fetching:

- `profile.first_name`, `profile.stripe_connect_onboarded` (the existing Connect banner check)
- `projects` with `clients(name)` joined — for pipeline columns
- `quotes` with `clients(name)`, filtered to `status in ('draft', 'sent')` — for coach
- `invoices` with `clients(name)`, filtered to `status in ('draft', 'sent', 'overdue')` — for coach + pipeline totals

All four queries fire in parallel. No new tables, no new columns.

## Components

```
app/dashboard/page.tsx                 # server: fetch data, render layout
app/dashboard/_components/
  Greeting.tsx                         # server: greeting + date
  ActionTiles.tsx                      # server: three big buttons (links)
  Pipeline.tsx                         # client: interactive — advance button + pill popover
  PipelineCard.tsx                     # client: single project card with buttons
  Coach.tsx                            # client: picker logic + cycle through suggestions
```

Underscore prefix on `_components` keeps Next.js from treating them as routes.

## API changes

**None.** Reuse existing `PUT /api/projects/[id]` for status updates. Reuse existing GET endpoints (the page does its own server-side fetches, no extra API needed).

## Behavior preserved from existing dashboard

- The Stripe Connect banner (conditionally rendered, already shipped) stays at the very top, above the greeting.
- Middleware-protected route — no auth changes.

## Out of scope (intentional)

- **Drag-and-drop pipeline.** Chose advance button + pill instead. Lighter, mobile-friendly, no dependency.
- **The three legacy stat cards** ("Outstanding invoices", "Quotes awaiting response", "Active projects"). Their information is now visible in the pipeline (counts per column) and the coach (overdue-invoice focus). Deleting them is a feature.
- **Auto-transition on quote send.** Currently not wired (only invoice-create triggers project move). Could be added but is independent.
- **Pipeline drag-to-reorder within column.** No ordering — sort is `created_at desc` per column.
- **Settings page Connect entry point.** Already-flagged follow-up. Not part of this redesign.

## Risks / open questions

- **Coach over-suggesting.** If the contractor has 8 overdue invoices, the coach will keep showing overdue ones until they click through all of them. That's correct behavior but could feel repetitive. Mitigation: the cycle moves to a different *category* once 3 from the current one are shown.
- **"Working" column conflates `in_progress` and `complete`.** Documented above as intentional — a contractor doesn't separate the two mentally. Anyone who needs the distinction can use the pill.
- **Empty pipeline first run.** First-time contractor has zero projects. All 5 columns empty. Should still feel inviting, not broken — empty state is `"—"` per column, and the Coach catch-all suggests creating the first quote.

## Success criteria

- A new contractor with zero data can land on `/dashboard` and immediately understand: (1) what they can do, (2) what they have in flight, (3) what's most important.
- Moving a project from "Lead" to "Paid" takes ≤ 4 clicks (one per advance) without leaving the dashboard.
- The coach surfaces a real, current problem in ≥ 90% of sessions for users with > 5 active items.
