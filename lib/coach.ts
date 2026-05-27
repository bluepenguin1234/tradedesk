import type { Quote, Invoice, ProjectStatus } from '@/types';

export interface ProjectLite {
  id: string;
  status: ProjectStatus;
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

function unsentDraftSuggestion(
  kind: 'quote' | 'invoice',
  number: string | null,
  clientName: string | null,
  id: string,
): Suggestion {
  return {
    parts: [
      { type: 'text', text: `Draft ${kind} ` },
      { type: 'em', text: number ?? 'untitled' },
      { type: 'text', text: ` for ` },
      { type: 'em', text: clientName ?? 'a client' },
      { type: 'text', text: ` hasn't been sent yet.` },
    ],
    ctaLabel: 'Send it →',
    ctaHref: `/dashboard/${kind}s/${id}`,
    category: 'unsent_draft',
  };
}

export function buildSuggestions({ invoices, quotes, projects }: CoachInput): Suggestion[] {
  const now = Date.now();
  const out: Suggestion[] = [];

  // 1. Overdue invoices (status=sent, due_date < today)
  for (const inv of invoices) {
    if (inv.status !== 'sent' || !inv.due_date) continue;
    const dueMs = new Date(inv.due_date).getTime();
    if (dueMs >= now) continue;
    const overdueDays = Math.floor((now - dueMs) / oneDay);
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

  // 2. Stale sent quotes (>7d, no response)
  for (const q of quotes) {
    if (q.status !== 'sent' || !q.sent_at) continue;
    const sentMs = new Date(q.sent_at).getTime();
    if ((now - sentMs) <= sevenDays) continue;
    const days = Math.floor((now - sentMs) / oneDay);
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

  // 3. Unsent drafts (>1d old)
  for (const q of quotes) {
    if (q.status === 'draft' && (now - new Date(q.created_at).getTime()) > oneDay) {
      out.push(unsentDraftSuggestion('quote', q.quote_number, q.clients?.name ?? null, q.id));
    }
  }
  for (const inv of invoices) {
    if (inv.status === 'draft' && (now - new Date(inv.created_at).getTime()) > oneDay) {
      out.push(unsentDraftSuggestion('invoice', inv.invoice_number, inv.clients?.name ?? null, inv.id));
    }
  }

  // 4 & 5. Only fire fallback categories when nothing higher-priority surfaced.
  if (out.length === 0) {
    const activeStatuses = new Set<ProjectStatus>(['lead', 'quoted', 'in_progress', 'complete']);
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
    } else {
      out.push({
        parts: [
          { type: 'text', text: `You're caught up. Everything looks healthy.` },
        ],
        ctaLabel: 'View this week →',
        ctaHref: `/dashboard/projects`,
        category: 'caught_up',
      });
    }
  }

  return out;
}
