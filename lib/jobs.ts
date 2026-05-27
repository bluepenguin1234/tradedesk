import type { ProjectStatus, QuoteStatus, InvoiceStatus } from '@/types';

export type JobColumn = 'todo' | 'waiting' | 'done';

export interface JobCard {
  key: string;
  column: JobColumn;
  clientName: string;
  context: string;
  amount: number | null;
  ago: string | null;
  primary: { label: string; href: string } | null;
  // For Waiting cards: an in-place action button (POSTs to endpoint, then refreshes).
  nudge: { label: string; endpoint: string } | null;
  detailHref: string;
  sortKey: number;
}

interface ProjectRow {
  id: string;
  status: ProjectStatus;
  created_at: string;
  clients: { name: string } | null;
}
interface QuoteRow {
  id: string;
  status: QuoteStatus;
  total: number;
  sent_at: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}
interface InvoiceRow {
  id: string;
  status: InvoiceStatus;
  total: number;
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}
interface ClientRow {
  id: string;
  name: string;
  created_at: string;
}

interface BuildJobsInput {
  projects: ProjectRow[];
  quotes: QuoteRow[];
  invoices: InvoiceRow[];
  clients: ClientRow[];
}

const oneDay = 24 * 60 * 60 * 1000;

function relativeTime(ts: string, now: number): string {
  const diff = now - new Date(ts).getTime();
  if (diff < oneDay) return 'today';
  const days = Math.floor(diff / oneDay);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

const ts = (s: string) => new Date(s).getTime();

export function buildJobCards({ projects, quotes, invoices, clients }: BuildJobsInput): JobCard[] {
  const now = Date.now();
  const out: JobCard[] = [];

  // PROJECTS — always shown
  for (const p of projects) {
    const clientName = p.clients?.name ?? 'No client';
    switch (p.status) {
      case 'lead':
        out.push({
          key: `p-${p.id}`,
          column: 'todo',
          clientName,
          context: `Added ${relativeTime(p.created_at, now)}`,
          amount: null, ago: null,
          primary: { label: 'Send quote →', href: '/dashboard/quotes/new' },
          nudge: null,
          detailHref: `/dashboard/projects/${p.id}`,
          sortKey: ts(p.created_at),
        });
        break;
      case 'quoted':
        out.push({
          key: `p-${p.id}`,
          column: 'waiting',
          clientName,
          context: 'Quote sent — waiting for response',
          amount: null, ago: null,
          primary: null,
          nudge: null,
          detailHref: `/dashboard/projects/${p.id}`,
          sortKey: ts(p.created_at),
        });
        break;
      case 'in_progress':
      case 'complete':
        out.push({
          key: `p-${p.id}`,
          column: 'todo',
          clientName,
          context: p.status === 'complete' ? 'Work done · ready to invoice' : 'Work in progress',
          amount: null, ago: null,
          primary: { label: 'Send invoice →', href: '/dashboard/invoices/new' },
          nudge: null,
          detailHref: `/dashboard/projects/${p.id}`,
          sortKey: ts(p.created_at),
        });
        break;
      case 'invoiced':
        out.push({
          key: `p-${p.id}`,
          column: 'waiting',
          clientName,
          context: 'Invoice sent — waiting for payment',
          amount: null, ago: null,
          primary: null,
          nudge: null,
          detailHref: `/dashboard/projects/${p.id}`,
          sortKey: ts(p.created_at),
        });
        break;
      case 'paid':
        out.push({
          key: `p-${p.id}`,
          column: 'done',
          clientName,
          context: 'paid',
          amount: null,
          ago: relativeTime(p.created_at, now),
          primary: null, nudge: null,
          detailHref: `/dashboard/projects/${p.id}`,
          sortKey: ts(p.created_at),
        });
        break;
    }
  }

  // ORPHAN QUOTES (no project) — skip declined and invoiced (the invoice represents the latter)
  for (const q of quotes) {
    if (q.project_id) continue;
    const clientName = q.clients?.name ?? 'No client';
    switch (q.status) {
      case 'draft':
        out.push({
          key: `q-${q.id}`,
          column: 'todo',
          clientName,
          context: q.total > 0 ? `Draft quote · $${q.total.toFixed(2)}` : 'Draft quote · no line items yet',
          amount: null, ago: null,
          primary: { label: 'Finish & send →', href: `/dashboard/quotes/${q.id}` },
          nudge: null,
          detailHref: `/dashboard/quotes/${q.id}`,
          sortKey: ts(q.created_at),
        });
        break;
      case 'sent':
        if (q.sent_at) {
          out.push({
            key: `q-${q.id}`,
            column: 'waiting',
            clientName,
            context: `Quote sent ${relativeTime(q.sent_at, now)} · $${q.total.toFixed(2)}`,
            amount: null, ago: null,
            primary: null,
            nudge: { label: 'Send a reminder', endpoint: `/api/quotes/${q.id}/reminder` },
            detailHref: `/dashboard/quotes/${q.id}`,
            sortKey: ts(q.sent_at),
          });
        }
        break;
      case 'accepted':
        out.push({
          key: `q-${q.id}`,
          column: 'todo',
          clientName,
          context: `Quote accepted · $${q.total.toFixed(2)} · ready to invoice`,
          amount: null, ago: null,
          primary: { label: 'Send invoice →', href: '/dashboard/invoices/new' },
          nudge: null,
          detailHref: `/dashboard/quotes/${q.id}`,
          sortKey: ts(q.created_at),
        });
        break;
      // declined / invoiced: hidden
    }
  }

  // ORPHAN INVOICES (no project)
  for (const inv of invoices) {
    if (inv.project_id) continue;
    const clientName = inv.clients?.name ?? 'No client';
    switch (inv.status) {
      case 'draft':
        out.push({
          key: `i-${inv.id}`,
          column: 'todo',
          clientName,
          context: `Draft invoice · $${inv.total.toFixed(2)}`,
          amount: null, ago: null,
          primary: { label: 'Send invoice →', href: `/dashboard/invoices/${inv.id}` },
          nudge: null,
          detailHref: `/dashboard/invoices/${inv.id}`,
          sortKey: ts(inv.created_at),
        });
        break;
      case 'sent':
      case 'overdue': {
        const sentText = inv.sent_at ? `Invoice sent ${relativeTime(inv.sent_at, now)}` : 'Invoice sent';
        const overdueText = inv.status === 'overdue' && inv.due_date
          ? ` · overdue since ${relativeTime(inv.due_date, now)}`
          : '';
        out.push({
          key: `i-${inv.id}`,
          column: 'waiting',
          clientName,
          context: `${sentText} · $${inv.total.toFixed(2)}${overdueText}`,
          amount: null, ago: null,
          primary: null,
          nudge: { label: 'Send a reminder', endpoint: `/api/invoices/${inv.id}/reminder` },
          detailHref: `/dashboard/invoices/${inv.id}`,
          sortKey: inv.sent_at ? ts(inv.sent_at) : ts(inv.created_at),
        });
        break;
      }
      case 'paid':
        if (inv.paid_at && (now - ts(inv.paid_at)) < 60 * oneDay) {
          out.push({
            key: `i-${inv.id}`,
            column: 'done',
            clientName,
            context: 'paid',
            amount: inv.total,
            ago: relativeTime(inv.paid_at, now),
            primary: null, nudge: null,
            detailHref: `/dashboard/invoices/${inv.id}`,
            sortKey: ts(inv.paid_at),
          });
        }
        break;
    }
  }

  // LEAD cards: recent clients (≤14d) with no active work
  const activeQuoteClientIds = new Set(
    quotes.filter(q => q.status !== 'declined').map(q => q.clients?.name)
  );
  const invoiceClientIds = new Set(invoices.map(i => i.clients?.name));
  for (const c of clients) {
    if ((now - ts(c.created_at)) > 14 * oneDay) continue;
    // Filter by client name match (don't have direct client_id on JobsInput for quotes/invoices — use name)
    if (activeQuoteClientIds.has(c.name) || invoiceClientIds.has(c.name)) continue;
    out.push({
      key: `c-${c.id}`,
      column: 'todo',
      clientName: c.name,
      context: `Added ${relativeTime(c.created_at, now)}`,
      amount: null, ago: null,
      primary: { label: 'Send quote →', href: '/dashboard/quotes/new' },
      nudge: null,
      detailHref: `/dashboard/clients/${c.id}`,
      sortKey: ts(c.created_at),
    });
  }

  // Sort: To Do oldest first (most urgent at top of list visually = oldest unfinished tasks),
  // Waiting oldest first, Done newest first
  out.sort((a, b) => {
    const order: Record<JobColumn, number> = { todo: 0, waiting: 1, done: 2 };
    if (a.column !== b.column) return order[a.column] - order[b.column];
    return a.column === 'done' ? b.sortKey - a.sortKey : a.sortKey - b.sortKey;
  });

  return out;
}
