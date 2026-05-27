'use client';

import { PipelineCard } from './PipelineCard';
import { QuoteCard } from './QuoteCard';
import { InvoiceCard } from './InvoiceCard';
import { PIPELINE_COLUMNS, itemToColumn, type PipelineItem } from '@/lib/pipeline';

export function Pipeline({ items }: { items: PipelineItem[] }) {
  const visible = items.filter(i => itemToColumn(i) !== null);
  const groups = PIPELINE_COLUMNS.map(col => ({
    column: col,
    items: visible.filter(i => itemToColumn(i) === col),
  }));

  // "In flight" = anything not yet paid. Projects use their resolved amount,
  // quotes use total, invoices use total (unless paid).
  const inFlight = visible.reduce((sum, i) => {
    if (i.kind === 'project') {
      return i.status === 'paid' ? sum : sum + (i.amount ?? 0);
    }
    if (i.kind === 'quote') {
      return sum + i.total;
    }
    // invoice
    return i.status === 'paid' ? sum : sum + i.total;
  }, 0);

  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-[#6b7280] uppercase tracking-[0.15em] font-medium">Pipeline</span>
        <span className="text-xs text-[#9ca3af] font-light tabular-nums">
          {visible.length} {visible.length === 1 ? 'item' : 'items'} · ${inFlight.toFixed(2)} in flight
        </span>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 mb-10 overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 min-w-[640px]">
          {groups.map(g => (
            <div key={g.column}>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-[0.12em] font-medium text-center pb-2 mb-2 border-b border-[#f3f4f6]">
                {g.column}
                <span className="ml-1.5 inline-block bg-[#f3f4f6] text-[9px] px-1.5 py-0.5 rounded-full">{g.items.length}</span>
              </div>
              <div className="min-h-[120px] px-0.5">
                {g.items.length === 0 ? (
                  <p className="text-[11px] text-[#d1d5db] italic text-center pt-3">—</p>
                ) : (
                  g.items.map(item => {
                    if (item.kind === 'project') {
                      return (
                        <PipelineCard
                          key={`p-${item.id}`}
                          project={{
                            id: item.id,
                            name: item.name,
                            status: item.status,
                            clients: item.clients,
                            amount: item.amount,
                          }}
                        />
                      );
                    }
                    if (item.kind === 'quote') {
                      return <QuoteCard key={`q-${item.id}`} quote={item} />;
                    }
                    return <InvoiceCard key={`i-${item.id}`} invoice={item} />;
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
