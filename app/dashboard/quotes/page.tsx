'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';

interface QuoteRow {
  id: string;
  quote_number: string | null;
  status: QuoteStatus;
  total: number;
  expires_at: string | null;
  clients: { name: string } | null;
}

export default function Quotes() {
  const [quotes, setQuotes] = useState<QuoteRow[] | null>(null);

  useEffect(() => {
    fetch('/api/quotes').then(r => r.json()).then(d => setQuotes(d.quotes ?? []));
  }, []);

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>Quotes</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">All your quotes in one place.</p>
        </div>
        <Link href="/dashboard/quotes/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          New Quote →
        </Link>
      </div>
      {quotes === null ? (
        <Empty label="Loading…" />
      ) : quotes.length === 0 ? (
        <Empty label="No quotes yet. Create your first one." />
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          {quotes.map((q, i) => (
            <Link key={q.id} href={`/dashboard/quotes/${q.id}`} className={`grid grid-cols-[120px_1fr_auto_110px] gap-4 items-center px-6 py-4 hover:bg-[#f9fafb] transition-colors ${i > 0 ? 'border-t border-[#f3f4f6]' : ''}`}>
              <span className="text-sm text-[#0f0f0f] font-medium">{q.quote_number ?? '—'}</span>
              <span className="text-sm text-[#6b7280] font-light truncate">{q.clients?.name ?? 'No client'}</span>
              <span className="text-sm text-[#0f0f0f] font-medium tabular-nums">${q.total.toFixed(2)}</span>
              <QuoteStatusBadge status={q.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
      <p className="text-[#9ca3af] text-sm font-light">{label}</p>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const colors: Record<QuoteStatus, string> = {
    draft: 'bg-[#f3f4f6] text-[#6b7280]',
    sent: 'bg-blue-50 text-blue-700',
    accepted: 'bg-[#f0fdf4] text-[#15803d]',
    declined: 'bg-red-50 text-red-600',
    invoiced: 'bg-indigo-50 text-indigo-700',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors[status]} justify-self-end`}>{status}</span>;
}
