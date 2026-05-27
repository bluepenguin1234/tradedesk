# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/dashboard` overview with a three-section action-first layout — big-button quick actions, interactive pipeline of all projects, and a single "today's focus" coach card.

**Architecture:** `app/dashboard/page.tsx` becomes an async server component that fetches profile + projects + quotes + invoices in parallel via Supabase server client and composes four child components (Greeting, ActionTiles, Pipeline, Coach). Two new pure utility modules (`lib/pipeline.ts`, `lib/coach.ts`) hold the column-mapping, next-status, and suggestion-picking logic so they're independently testable and don't bloat the components. Pipeline interactivity is a small client component using `router.refresh()` after PUT to re-fetch on the server — no client-side state management library, no drag-and-drop dependency.

**Tech Stack:** Next.js 15 App Router (server + client components), Supabase server client (existing `lib/supabase.ts`), Tailwind for styling (matches existing dashboard tokens: `#15803d` primary, `#9ca3af` muted, `#e5e7eb` borders, `var(--font-serif)` for headings).

**Spec:** [docs/superpowers/specs/2026-05-26-dashboard-redesign-design.md](../specs/2026-05-26-dashboard-redesign-design.md)

**Testing approach:** This codebase has no unit-test framework set up. We rely on Next.js's TypeScript build (`npm run build`) as the type-check, and a Playwright-driven browser smoke test in the final task to verify behavior. Adding Jest/Vitest is intentionally out of scope.

---

## File Structure

**Create:**
- `lib/pipeline.ts` — column mapping, next-status calculation, status labels
- `lib/coach.ts` — `buildSuggestions(data)` returning the prioritized suggestion list
- `app/dashboard/_components/Greeting.tsx` — server component, greeting + date
- `app/dashboard/_components/ActionTiles.tsx` — server component, three big tiles
- `app/dashboard/_components/PipelineCard.tsx` — client component, single project card with advance button + pill popover
- `app/dashboard/_components/Pipeline.tsx` — client component, wraps columns and cards
- `app/dashboard/_components/Coach.tsx` — client component, picker logic + cycle

**Modify:**
- `app/dashboard/page.tsx` — rewrite as async server component that fetches data and composes the above

**Why the split:**
- Pure logic (`lib/pipeline.ts`, `lib/coach.ts`) stays out of React so a future test or reuse from a different surface is trivial.
- Components that need `'use client'` (Pipeline, PipelineCard, Coach) are isolated; the orchestrator page stays server-only.
- The `_components` folder uses Next's underscore convention so it isn't treated as a route.

---

### Task 1: Pure utility modules

**Files:**
- Create: `lib/pipeline.ts`
- Create: `lib/coach.ts`

- [ ] **Step 1: Create `lib/pipeline.ts`**

```typescript
import type { ProjectStatus } from '@/types';

export type PipelineColumn = 'Lead' | 'Quoted' | 'Working' | 'Invoiced' | 'Paid';

export const PIPELINE_COLUMNS: PipelineColumn[] = ['Lead', 'Quoted', 'Working', 'Invoiced', 'Paid'];

export function statusToColumn(status: ProjectStatus): PipelineColumn {
  switch (status) {
    case 'lead': return 'Lead';
    case 'quoted': return 'Quoted';
    case 'in_progress':
    case 'complete':
      return 'Working';
    case 'invoiced': return 'Invoiced';
    case 'paid': return 'Paid';
  }
}

// Advance button skips 'complete' — most contractors go straight from working to invoicing.
// 'complete' remains reachable via the pill popover.
const advanceOrder: ProjectStatus[] = ['lead', 'quoted', 'in_progress', 'invoiced', 'paid'];

export function nextStatus(current: ProjectStatus): ProjectStatus | null {
  if (current === 'complete') return 'invoiced';
  const i = advanceOrder.indexOf(current);
  if (i < 0 || i === advanceOrder.length - 1) return null;
  return advanceOrder[i + 1];
}

export const ALL_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
];
```

- [ ] **Step 2: Create `lib/coach.ts`**

```typescript
import type { Quote, Invoice } from '@/types';

export interface ProjectLite {
  id: string;
  status: string;
}

export interface CoachInput {
  invoices: (Pick<Invoice, 'id' | 'invoice_number' | 'status' | 'total' | 'due_date' | 'sent_at' | 'created_at'> & { clients: { name: string } | null })[];
  quotes: (Pick<Quote, 'id' | 'quote_number' | 'status' | 'sent_at' | 'created_at'> & { clients: { name: string } | null })[];
  projects: ProjectLite[];
}

export type SuggestionPart = { type: 'text' | 'em'; text: string };

export interface Suggestion {
  parts: SuggestionPart[];
  ctaLabel: string;
  ctaHref: string;
  category: 'overdue' | 'stale_quote' | 'unsent_draft' | 'no_work' | 'caught_up';
}

const oneDay = 24 * 60 * 60 * 1000;
const sevenDays = 7 * oneDay;

export function buildSuggestions({ invoices, quotes, projects }: CoachInput): Suggestion[] {
  const now = Date.now();
  const out: Suggestion[] = [];

  // 1. Overdue invoices (status=sent, due_date < today)
  for (const inv of invoices) {
    if (inv.status === 'sent' && inv.due_date && new Date(inv.due_date).getTime() < now) {
      const overdueDays = Math.floor((now - new Date(inv.due_date).getTime()) / oneDay);
      const clientName = inv.clients?.name ?? 'A client';
      out.push({
        parts: [
          { type: 'em', text: clientName },
          { type: 'text', text: ' owes you ' },
          { type: 'em', text: `$${inv.total.toFixed(2)}` },
          { type: 'text', text: ` and it's ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue. A friendly reminder usually gets paid within 48 hours.` },
        ],
        ctaLabel: 'Open invoice →',
        ctaHref: `/dashboard/invoices/${inv.id}`,
        category: 'overdue',
      });
    }
  }

  // 2. Stale sent quotes (>7d, no response)
  for (const q of quotes) {
    if (q.status === 'sent' && q.sent_at && (now - new Date(q.sent_at).getTime()) > sevenDays) {
      const days = Math.floor((now - new Date(q.sent_at).getTime()) / oneDay);
      out.push({
        parts: [
          { type: 'text', text: `Quote ` },
          { type: 'em', text: q.quote_number ?? 'untitled' },
          { type: 'text', text: ` for ` },
          { type: 'em', text: q.clients?.name ?? 'a client' },
          { type: 'text', text: ` hasn't gotten a response in ${days} days. Worth a follow-up.` },
        ],
        ctaLabel: 'Open quote →',
        ctaHref: `/dashboard/quotes/${q.id}`,
        category: 'stale_quote',
      });
    }
  }

  // 3. Unsent drafts (>1d old)
  for (const q of quotes) {
    if (q.status === 'draft' && (now - new Date(q.created_at).getTime()) > oneDay) {
      out.push({
        parts: [
          { type: 'text', text: 'Draft quote ' },
          { type: 'em', text: q.quote_number ?? 'untitled' },
          { type: 'text', text: ` for ` },
          { type: 'em', text: q.clients?.name ?? 'a client' },
          { type: 'text', text: ` hasn't been sent yet.` },
        ],
        ctaLabel: 'Send it →',
        ctaHref: `/dashboard/quotes/${q.id}`,
        category: 'unsent_draft',
      });
    }
  }
  for (const inv of invoices) {
    if (inv.status === 'draft' && (now - new Date(inv.created_at).getTime()) > oneDay) {
      out.push({
        parts: [
          { type: 'text', text: 'Draft invoice ' },
          { type: 'em', text: inv.invoice_number ?? 'untitled' },
          { type: 'text', text: ` for ` },
          { type: 'em', text: inv.clients?.name ?? 'a client' },
          { type: 'text', text: ` hasn't been sent yet.` },
        ],
        ctaLabel: 'Send it →',
        ctaHref: `/dashboard/invoices/${inv.id}`,
        category: 'unsent_draft',
      });
    }
  }

  // 4. No active work
  const activeStatuses = new Set(['lead', 'quoted', 'in_progress', 'complete']);
  const anyActive = projects.some(p => activeStatuses.has(p.status));
  if (!anyActive) {
    out.push({
      parts: [
        { type: 'text', text: `Quiet week so far. Send a quote or add a new client to keep things moving.` },
      ],
      ctaLabel: 'New quote →',
      ctaHref: `/dashboard/quotes/new`,
      category: 'no_work',
    });
  }

  // 5. Catch-all
  if (out.length === 0) {
    out.push({
      parts: [
        { type: 'text', text: `You're caught up. Everything looks healthy.` },
      ],
      ctaLabel: 'View this week →',
      ctaHref: `/dashboard/projects`,
      category: 'caught_up',
    });
  }

  return out;
}
```

- [ ] **Step 3: Build to verify TypeScript compiles**

Run: `cd "C:\Users\Brian\Desktop\tradedesk" && npm run build 2>&1 | tail -5`
Expected: clean build, no type errors. (Both files are pure and unimported — should compile silently.)

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git add lib/pipeline.ts lib/coach.ts
git commit -m "Add pipeline + coach utility modules for dashboard redesign

Pure functions for mapping projects.status to pipeline columns,
computing the next stage for the advance button, and building the
prioritized coach suggestion list from invoices/quotes/projects.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Greeting + ActionTiles components (server)

**Files:**
- Create: `app/dashboard/_components/Greeting.tsx`
- Create: `app/dashboard/_components/ActionTiles.tsx`

- [ ] **Step 1: Create `app/dashboard/_components/Greeting.tsx`**

```typescript
export function Greeting({ firstName }: { firstName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const name = firstName ? `, ${firstName}` : '';

  return (
    <>
      <h1 className="text-3xl text-[#0f0f0f] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
        {greeting}{name}.
      </h1>
      <p className="text-[#9ca3af] text-sm font-light mb-10">{date}.</p>
    </>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/_components/ActionTiles.tsx`**

```typescript
import Link from 'next/link';

const tiles = [
  { href: '/dashboard/quotes/new', label: 'New Quote', icon: '＋', primary: true },
  { href: '/dashboard/invoices/new', label: 'New Invoice', icon: '＄', primary: false },
  { href: '/dashboard/clients/new', label: 'Add Client', icon: '☺', primary: false },
];

export function ActionTiles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
      {tiles.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex flex-col items-center justify-center text-center rounded-2xl border px-4 py-7 min-h-[130px] transition-colors ${
            t.primary
              ? 'bg-[#15803d] border-[#15803d] text-white hover:bg-[#14532d]'
              : 'bg-white border-[#e5e7eb] text-[#0f0f0f] hover:bg-[#f0fdf4] hover:border-[#15803d]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg mb-3 ${
              t.primary ? 'bg-white/20 text-white' : 'bg-[#f0fdf4] text-[#15803d]'
            }`}
          >
            {t.icon}
          </div>
          <span className="text-sm font-medium">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Build to verify types compile**

Run: `cd "C:\Users\Brian\Desktop\tradedesk" && npm run build 2>&1 | tail -5`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git add app/dashboard/_components/Greeting.tsx app/dashboard/_components/ActionTiles.tsx
git commit -m "Add Greeting + ActionTiles dashboard components

Time-of-day-aware greeting with today's date. Three large action tiles
(New Quote primary, New Invoice, Add Client) using existing color tokens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: PipelineCard client component

**Files:**
- Create: `app/dashboard/_components/PipelineCard.tsx`

- [ ] **Step 1: Create `app/dashboard/_components/PipelineCard.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { ProjectStatus } from '@/types';
import { nextStatus, ALL_STATUSES } from '@/lib/pipeline';

export interface CardProject {
  id: string;
  name: string;
  status: ProjectStatus;
  clients: { name: string } | null;
  amount: number | null;
}

export function PipelineCard({ project }: { project: CardProject }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const next = nextStatus(project.status);

  // Close popover on outside click
  useEffect(() => {
    if (!pillOpen) return;
    const handler = () => setPillOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [pillOpen]);

  async function setStatus(status: ProjectStatus) {
    setBusy(true);
    setPillOpen(false);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="group relative bg-[#f9fafb] hover:bg-white border border-[#e5e7eb] hover:border-[#15803d] rounded-lg p-2.5 mb-2 transition-colors">
      <Link href={`/dashboard/projects/${project.id}`} className="block">
        <div className="text-xs font-medium text-[#0f0f0f] leading-tight pr-6 truncate">{project.name}</div>
        <div className="text-[10px] text-[#9ca3af] font-light truncate mt-0.5">{project.clients?.name ?? 'No client'}</div>
        {project.amount !== null && (
          <div className="text-[11px] text-[#15803d] font-semibold mt-1 tabular-nums">${project.amount.toFixed(2)}</div>
        )}
      </Link>

      {next && (
        <button
          onClick={e => { e.stopPropagation(); e.preventDefault(); setStatus(next); }}
          disabled={busy}
          title={`Advance to ${ALL_STATUSES.find(s => s.value === next)?.label}`}
          aria-label="Advance to next stage"
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-[#e5e7eb] text-[#9ca3af] hover:text-[#15803d] hover:border-[#15803d] flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 leading-none"
        >
          →
        </button>
      )}

      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); setPillOpen(o => !o); }}
        title="Change status"
        aria-label="Change status"
        className="absolute bottom-1.5 right-1.5 text-[10px] text-[#d1d5db] hover:text-[#0f0f0f] opacity-0 group-hover:opacity-100 transition-opacity leading-none"
      >
        •••
      </button>

      {pillOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute z-10 top-full right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-1 min-w-[130px]"
        >
          {ALL_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`block w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${s.value === project.status ? 'bg-[#f0fdf4] text-[#15803d] font-medium' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0f0f0f]'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify types**

Run: `cd "C:\Users\Brian\Desktop\tradedesk" && npm run build 2>&1 | tail -5`
Expected: clean build. Note: the component is unimported by anything yet — Next.js may warn about that, ignore.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git add app/dashboard/_components/PipelineCard.tsx
git commit -m "Add PipelineCard client component

Single project card for the pipeline. Body click navigates to project
detail. Hover reveals 'advance to next stage' arrow (top-right) and
'change status' popover trigger (bottom-right). Uses router.refresh() to
re-fetch dashboard data after a status change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Pipeline wrapper component

**Files:**
- Create: `app/dashboard/_components/Pipeline.tsx`

- [ ] **Step 1: Create `app/dashboard/_components/Pipeline.tsx`**

```typescript
'use client';

import { PipelineCard, type CardProject } from './PipelineCard';
import { PIPELINE_COLUMNS, statusToColumn } from '@/lib/pipeline';

export type PipelineProject = CardProject;

export function Pipeline({ projects }: { projects: PipelineProject[] }) {
  const groups = PIPELINE_COLUMNS.map(col => ({
    column: col,
    projects: projects.filter(p => statusToColumn(p.status) === col),
  }));

  // "In flight" = anything not yet paid
  const inFlight = projects
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-[#6b7280] uppercase tracking-[0.15em] font-medium">Pipeline</span>
        <span className="text-xs text-[#9ca3af] font-light tabular-nums">
          {projects.length} {projects.length === 1 ? 'job' : 'jobs'} · ${inFlight.toFixed(2)} in flight
        </span>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 mb-10 overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 min-w-[640px]">
          {groups.map(g => (
            <div key={g.column}>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-[0.12em] font-medium text-center pb-2 mb-2 border-b border-[#f3f4f6]">
                {g.column}
                <span className="ml-1.5 inline-block bg-[#f3f4f6] text-[9px] px-1.5 py-0.5 rounded-full">{g.projects.length}</span>
              </div>
              <div className="min-h-[120px] px-0.5">
                {g.projects.length === 0 ? (
                  <p className="text-[11px] text-[#d1d5db] italic text-center pt-3">—</p>
                ) : (
                  g.projects.map(p => <PipelineCard key={p.id} project={p} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "C:\Users\Brian\Desktop\tradedesk" && npm run build 2>&1 | tail -5`
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git add app/dashboard/_components/Pipeline.tsx
git commit -m "Add Pipeline wrapper grouping projects into 5 columns

Groups projects by statusToColumn(), renders one PipelineCard per project
in each column. Shows in-flight total (sum of non-paid amounts) in the
section meta. Horizontally scrolls on narrow viewports.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Coach component

**Files:**
- Create: `app/dashboard/_components/Coach.tsx`

- [ ] **Step 1: Create `app/dashboard/_components/Coach.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Suggestion } from '@/lib/coach';

export function Coach({ suggestions }: { suggestions: Suggestion[] }) {
  const [index, setIndex] = useState(0);
  if (suggestions.length === 0) return null;
  const s = suggestions[index % suggestions.length];

  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-[#6b7280] uppercase tracking-[0.15em] font-medium">Today&apos;s focus</span>
        <span className="text-xs text-[#9ca3af] font-light">picked from your data</span>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-7 text-center">
        <p
          className="text-[#0f0f0f] mx-auto max-w-xl leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', fontSize: '20px' }}
        >
          {s.parts.map((p, i) =>
            p.type === 'em'
              ? <em key={i} className="not-italic text-[#15803d] font-medium">{p.text}</em>
              : <span key={i}>{p.text}</span>
          )}
        </p>
        <Link
          href={s.ctaHref}
          className="inline-block mt-5 bg-[#15803d] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors"
        >
          {s.ctaLabel}
        </Link>
        {suggestions.length > 1 && (
          <button
            onClick={() => setIndex(i => (i + 1) % suggestions.length)}
            className="block mx-auto mt-4 text-xs text-[#9ca3af] hover:text-[#0f0f0f] underline font-light"
          >
            Show me a different focus
          </button>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "C:\Users\Brian\Desktop\tradedesk" && npm run build 2>&1 | tail -5`
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git add app/dashboard/_components/Coach.tsx
git commit -m "Add Coach 'today's focus' component

Renders the highest-priority suggestion as a serif sentence with green
emphasis on key nouns. Primary CTA button + 'Show me a different focus'
link cycles through the suggestion list client-side. Hides itself when
the suggestion list is empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Wire it all together in `app/dashboard/page.tsx` + verify + push

**Files:**
- Modify: `app/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite `app/dashboard/page.tsx`**

```typescript
import { createSupabaseServerClient } from '@/lib/supabase';
import type { ProjectStatus, QuoteStatus, InvoiceStatus } from '@/types';
import { Greeting } from './_components/Greeting';
import { ActionTiles } from './_components/ActionTiles';
import { Pipeline, type PipelineProject } from './_components/Pipeline';
import { Coach } from './_components/Coach';
import { buildSuggestions } from '@/lib/coach';

// Shape Supabase returns for our joined queries. We type the rows manually
// because we don't have generated Supabase types.
interface ProjectRow {
  id: string;
  name: string;
  status: ProjectStatus;
  clients: { name: string } | null;
}
interface QuoteRow {
  id: string;
  quote_number: string | null;
  status: QuoteStatus;
  total: number;
  sent_at: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}
interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  total: number;
  due_date: string | null;
  sent_at: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // middleware guards but bail safely

  const [profileRes, projectsRes, quotesRes, invoicesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, stripe_connect_onboarded')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, status, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('quotes')
      .select('id, quote_number, status, total, sent_at, created_at, project_id, clients(name)')
      .eq('user_id', user.id),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, due_date, sent_at, created_at, project_id, clients(name)')
      .eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const projects = (projectsRes.data ?? []) as unknown as ProjectRow[];
  const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];
  const invoices = (invoicesRes.data ?? []) as unknown as InvoiceRow[];

  // Per project, pick the dollar amount to show on its pipeline card.
  // If invoiced/paid: use the latest invoice's total. Otherwise: latest quote's total.
  const latestInvoiceByProject = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.project_id && !latestInvoiceByProject.has(inv.project_id)) {
      latestInvoiceByProject.set(inv.project_id, inv.total);
    }
  }
  const latestQuoteByProject = new Map<string, number>();
  for (const q of quotes) {
    if (q.project_id && !latestQuoteByProject.has(q.project_id)) {
      latestQuoteByProject.set(q.project_id, q.total);
    }
  }

  const pipelineProjects: PipelineProject[] = projects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    clients: p.clients,
    amount:
      p.status === 'invoiced' || p.status === 'paid'
        ? latestInvoiceByProject.get(p.id) ?? null
        : latestQuoteByProject.get(p.id) ?? null,
  }));

  const suggestions = buildSuggestions({
    invoices: invoices.map(i => ({
      id: i.id,
      invoice_number: i.invoice_number,
      status: i.status,
      total: i.total,
      due_date: i.due_date,
      sent_at: i.sent_at,
      created_at: i.created_at,
      clients: i.clients,
    })),
    quotes: quotes.map(q => ({
      id: q.id,
      quote_number: q.quote_number,
      status: q.status,
      sent_at: q.sent_at,
      created_at: q.created_at,
      clients: q.clients,
    })),
    projects: projects.map(p => ({ id: p.id, status: p.status })),
  });

  const stripeOnboarded = profile?.stripe_connect_onboarded ?? false;

  return (
    <div className="px-8 py-10 max-w-5xl">
      {!stripeOnboarded && (
        <div className="bg-[#fefce8] border border-[#fde047] rounded-xl px-5 py-4 flex items-center justify-between mb-8">
          <p className="text-sm text-[#713f12] font-light">
            Connect Stripe to start collecting invoice payments online.
          </p>
          <a
            href="/api/stripe/connect"
            className="text-sm text-[#713f12] font-medium underline shrink-0 ml-4"
          >
            Connect Stripe →
          </a>
        </div>
      )}

      <Greeting firstName={profile?.first_name ?? ''} />
      <ActionTiles />
      <Pipeline projects={pipelineProjects} />
      <Coach suggestions={suggestions} />
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd "C:\Users\Brian\Desktop\tradedesk" && npm run build 2>&1 | tail -10`
Expected: clean build, all 34 routes still compile.

- [ ] **Step 3: Browser smoke test — verify layout renders**

Make sure the dev server is running on port 4000 (`npm run dev -- --port 4000`). Then via Playwright MCP:

```
mcp__playwright__browser_navigate to http://localhost:4000/login
mcp__playwright__browser_fill_form with email=suchanekbs@gmail.com + password=<the user's password — pause here and ask the user>
mcp__playwright__browser_click on "Log in" button
mcp__playwright__browser_navigate to http://localhost:4000/dashboard
mcp__playwright__browser_snapshot
```

Verify in the snapshot:
- Greeting heading with first name present
- Three big tiles labeled "New Quote", "New Invoice", "Add Client"
- "Pipeline" section heading
- Five columns: Lead, Quoted, Working, Invoiced, Paid (each with a count badge)
- "Today's focus" coach card with a suggestion sentence and CTA button

If the user has no projects yet, the pipeline columns will all show `—` and the coach will show "Quiet week so far. Send a quote…" — that's correct behavior.

- [ ] **Step 4: Browser smoke test — verify advance button works**

If at least one project exists, hover over its card → click the "→" advance button in the top-right. Wait for the page to refresh. Verify the project moved one column to the right (e.g., a Lead-status project moved to Quoted).

If no projects exist, create one first via "New Project" or skip this step.

- [ ] **Step 5: Browser smoke test — verify pill popover works**

Hover over the same card → click the "•••" button in the bottom-right → a popover appears with all 5 status labels → click "Paid" → page refreshes → card now in the Paid column.

- [ ] **Step 6: Browser smoke test — verify coach cycle works**

If `suggestions.length > 1` (the coach component shows "Show me a different focus" link), click it → message changes to the next suggestion.

- [ ] **Step 7: Commit the page rewrite**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git add app/dashboard/page.tsx
git commit -m "Rewrite dashboard page as async server component

Fetches profile + projects + quotes + invoices in parallel via Supabase
server client, computes per-project pipeline amounts (latest invoice or
quote total), builds coach suggestions, and composes Greeting +
ActionTiles + Pipeline + Coach. Stripe Connect banner conditional render
preserved.

Replaces the placeholder stat cards and quick-action grid.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 8: Push everything**

```bash
cd "C:\Users\Brian\Desktop\tradedesk"
git push origin main
```

Vercel auto-deploys from main. Watch via:
```bash
cd "C:\Users\Brian\Desktop\tradedesk"
npx vercel ls tradedesk --prod 2>&1 | head -5
```

- [ ] **Step 9: Update the brainstorming companion to "done" and stop the server**

```bash
"C:/Users/Brian/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0/skills/brainstorming/scripts/stop-server.sh" "C:/Users/Brian/Desktop/tradedesk/.superpowers/brainstorm"
```

(Or leave running if the user wants further iteration.)

---

## Self-Review Notes

**Spec coverage:**
- Greeting ✓ Task 2
- Three Big Buttons ✓ Task 2
- Pipeline with 5 columns + advance + pill ✓ Tasks 3, 4
- Coach with priority order + cycle ✓ Tasks 1 (logic), 5 (UI)
- Server-side data fetch via Promise.all ✓ Task 6
- Stripe Connect banner conditional ✓ Task 6 (preserves existing behavior)
- "Working" column merges in_progress + complete ✓ Task 1 (`statusToColumn`)
- Advance button skips `complete` ✓ Task 1 (`nextStatus` logic + comment)
- Empty columns show `—` ✓ Task 4

**Placeholder scan:** No TBDs, no "appropriate error handling", no "similar to Task N". Test cases are described as browser smoke checks because the codebase has no test framework — called out at the top.

**Type consistency:** `CardProject` defined in PipelineCard.tsx is re-exported as `PipelineProject` from Pipeline.tsx and used in page.tsx. `Suggestion` defined in lib/coach.ts is imported by Coach.tsx. `ProjectStatus`, `QuoteStatus`, `InvoiceStatus` come from existing `@/types`. `nextStatus()` signature matches usage. Consistent.

**One gap I noticed:** The browser smoke test requires the user's login password. That's flagged in Task 6 Step 3 — agent will pause and ask.
