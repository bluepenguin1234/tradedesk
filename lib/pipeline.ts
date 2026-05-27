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
