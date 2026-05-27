import type { ProjectStatus, QuoteStatus, InvoiceStatus } from '@/types';

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

// A pipeline item is a project, an orphan quote, or an orphan invoice.
// Orphan = no project_id. When a quote/invoice is linked to a project,
// the project card represents it (no duplicates).
export type PipelineItem =
  | {
      kind: 'project';
      id: string;
      name: string;
      status: ProjectStatus;
      clients: { name: string } | null;
      amount: number | null;
    }
  | {
      kind: 'quote';
      id: string;
      quote_number: string | null;
      status: QuoteStatus;
      clients: { name: string } | null;
      total: number;
    }
  | {
      kind: 'invoice';
      id: string;
      invoice_number: string | null;
      status: InvoiceStatus;
      clients: { name: string } | null;
      total: number;
    };

// Returns the column an item belongs in, or null if the item should be hidden.
// Quotes in 'declined' or 'invoiced' are hidden (the invoice they became
// represents them). Invoices in unsupported states are skipped defensively.
export function itemToColumn(item: PipelineItem): PipelineColumn | null {
  switch (item.kind) {
    case 'project':
      return statusToColumn(item.status);
    case 'quote':
      switch (item.status) {
        case 'draft':
        case 'sent':
          return 'Quoted';
        case 'accepted':
          return 'Working';
        case 'declined':
        case 'invoiced':
          return null;
      }
      return null;
    case 'invoice':
      switch (item.status) {
        case 'draft':
          return 'Working';
        case 'sent':
        case 'overdue':
          return 'Invoiced';
        case 'paid':
          return 'Paid';
      }
      return null;
  }
}
