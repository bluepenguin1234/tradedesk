'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';

interface LineItem { description: string; qty: number; unit_price: number }

interface Quote {
  id: string;
  quote_number: string | null;
  status: QuoteStatus;
  line_items: LineItem[];
  tax_rate: number;
  subtotal: number;
  total: number;
  notes: string | null;
  expires_at: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  accepted_name: string | null;
  clients: { name: string; email: string | null } | null;
  projects: { name: string } | null;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/quotes/${id}`).then(async r => {
      if (!r.ok) { setError('Quote not found.'); return; }
      const { quote } = await r.json();
      setQuote(quote);
    });
  }, [id]);

  async function changeStatus(status: QuoteStatus) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Could not update.');
      return;
    }
    const { quote: updated } = await res.json();
    setQuote(prev => prev ? { ...prev, ...updated } : updated);
  }

  async function handleDelete() {
    if (!confirm('Delete this draft quote?')) return;
    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Could not delete.'); return; }
    router.push('/dashboard/quotes');
  }

  if (error && !quote) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <Link href="/dashboard/quotes" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to quotes</Link>
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center"><p className="text-[#9ca3af] text-sm font-light">{error}</p></div>
      </div>
    );
  }
  if (!quote) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center"><p className="text-[#9ca3af] text-sm font-light">Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link href="/dashboard/quotes" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to quotes</Link>

      <div className="flex items-center justify-between mb-8 mt-2 gap-4">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>{quote.quote_number ?? 'Quote'}</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">{quote.clients?.name ?? 'No client'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <QuoteStatusBadge status={quote.status} />
          {quote.status === 'draft' && (
            <>
              <button onClick={() => changeStatus('sent')} disabled={busy} className="text-sm px-4 py-2 rounded-full bg-[#15803d] text-white hover:bg-[#14532d] transition-colors font-medium disabled:opacity-50">Mark sent</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 rounded-full border border-[#fee2e2] text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors font-medium">Delete</button>
            </>
          )}
          {quote.status === 'sent' && (
            <>
              <button onClick={() => changeStatus('accepted')} disabled={busy} className="text-sm px-4 py-2 rounded-full border border-[#15803d] text-[#15803d] hover:bg-[#f0fdf4] transition-colors font-medium disabled:opacity-50">Mark accepted</button>
              <button onClick={() => changeStatus('declined')} disabled={busy} className="text-sm px-4 py-2 rounded-full border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors font-medium disabled:opacity-50">Mark declined</button>
            </>
          )}
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3"><p className="text-red-600 text-sm">{error}</p></div>}

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6">
        <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-4">Line items</p>
        {quote.line_items.length === 0 ? (
          <p className="text-sm text-[#9ca3af] font-light">No line items.</p>
        ) : (
          <div className="space-y-3">
            {quote.line_items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_100px_100px] gap-2 items-center text-sm">
                <span className="text-[#0f0f0f]">{it.description}</span>
                <span className="text-[#6b7280] text-center tabular-nums">{it.qty}</span>
                <span className="text-[#6b7280] text-right tabular-nums">${it.unit_price.toFixed(2)}</span>
                <span className="text-[#0f0f0f] text-right tabular-nums">${(it.qty * it.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-[#f3f4f6] mt-6 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-[#6b7280]"><span>Subtotal</span><span className="tabular-nums">${quote.subtotal.toFixed(2)}</span></div>
          {quote.tax_rate > 0 && <div className="flex justify-between text-sm text-[#6b7280]"><span>Tax ({quote.tax_rate}%)</span><span className="tabular-nums">${(quote.total - quote.subtotal).toFixed(2)}</span></div>}
          <div className="flex justify-between font-semibold text-[#0f0f0f]"><span>Total</span><span className="tabular-nums">${quote.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-4">
        <ReadField label="Notes" value={quote.notes} multiline />
        <div className="grid grid-cols-2 gap-4">
          <ReadField label="Expires" value={quote.expires_at ? new Date(quote.expires_at).toLocaleDateString() : null} />
          <ReadField label="Sent" value={quote.sent_at ? new Date(quote.sent_at).toLocaleString() : null} />
        </div>
        {quote.accepted_at && (
          <ReadField label={`Accepted ${new Date(quote.accepted_at).toLocaleString()}`} value={quote.accepted_name} />
        )}
      </div>

      {quote.status !== 'draft' && (
        <div className="mt-6 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4">
          <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Client-facing link</p>
          <code className="text-sm text-[#0f0f0f] break-all">{typeof window !== 'undefined' ? `${window.location.origin}/quotes/${quote.id}` : ''}</code>
        </div>
      )}
    </div>
  );
}

function ReadField({ label, value, multiline = false }: { label: string; value: string | null; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">{label}</p>
      <p className={`text-sm text-[#0f0f0f] font-light ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value || <span className="text-[#d1d5db]">—</span>}
      </p>
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
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors[status]}`}>{status}</span>;
}
