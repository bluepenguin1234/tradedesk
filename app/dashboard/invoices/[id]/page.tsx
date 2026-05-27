'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

interface LineItem { description: string; qty: number; unit_price: number }

interface Invoice {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  line_items: LineItem[];
  tax_rate: number;
  subtotal: number;
  total: number;
  notes: string | null;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  stripe_payment_link: string | null;
  clients: { name: string; email: string | null } | null;
  projects: { name: string } | null;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(async r => {
      if (!r.ok) { setError('Invoice not found.'); return; }
      const { invoice } = await r.json();
      setInvoice(invoice);
    });
  }, [id]);

  async function changeStatus(status: InvoiceStatus) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Could not update.'); return; }
    const { invoice: updated } = await res.json();
    setInvoice(prev => prev ? { ...prev, ...updated } : updated);
  }

  if (error && !invoice) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <Link href="/dashboard/invoices" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to invoices</Link>
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center"><p className="text-[#9ca3af] text-sm font-light">{error}</p></div>
      </div>
    );
  }
  if (!invoice) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center"><p className="text-[#9ca3af] text-sm font-light">Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link href="/dashboard/invoices" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to invoices</Link>

      <div className="flex items-center justify-between mb-8 mt-2 gap-4">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>{invoice.invoice_number ?? 'Invoice'}</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">{invoice.clients?.name ?? 'No client'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <InvoiceStatusBadge status={invoice.status} />
          {invoice.status !== 'paid' && (
            <button onClick={() => changeStatus('paid')} disabled={busy} className="text-sm px-4 py-2 rounded-full bg-[#15803d] text-white hover:bg-[#14532d] transition-colors font-medium disabled:opacity-50">
              Mark paid
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3"><p className="text-red-600 text-sm">{error}</p></div>}

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6">
        <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-4">Line items</p>
        {invoice.line_items.length === 0 ? (
          <p className="text-sm text-[#9ca3af] font-light">No line items.</p>
        ) : (
          <div className="space-y-3">
            {invoice.line_items.map((it, i) => (
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
          <div className="flex justify-between text-sm text-[#6b7280]"><span>Subtotal</span><span className="tabular-nums">${invoice.subtotal.toFixed(2)}</span></div>
          {invoice.tax_rate > 0 && <div className="flex justify-between text-sm text-[#6b7280]"><span>Tax ({invoice.tax_rate}%)</span><span className="tabular-nums">${(invoice.total - invoice.subtotal).toFixed(2)}</span></div>}
          <div className="flex justify-between font-semibold text-[#0f0f0f]"><span>Total</span><span className="tabular-nums">${invoice.total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-4">
        <ReadField label="Notes" value={invoice.notes} multiline />
        <div className="grid grid-cols-2 gap-4">
          <ReadField label="Due date" value={invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : null} />
          <ReadField label="Sent" value={invoice.sent_at ? new Date(invoice.sent_at).toLocaleString() : null} />
        </div>
        {invoice.paid_at && <ReadField label="Paid" value={new Date(invoice.paid_at).toLocaleString()} />}
        {invoice.stripe_payment_link && (
          <div>
            <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">Stripe payment link</p>
            <a href={invoice.stripe_payment_link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#15803d] hover:underline break-all">
              {invoice.stripe_payment_link}
            </a>
          </div>
        )}
      </div>
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

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-[#f3f4f6] text-[#6b7280]',
    sent: 'bg-blue-50 text-blue-700',
    paid: 'bg-[#f0fdf4] text-[#15803d]',
    overdue: 'bg-red-50 text-red-600',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors[status]}`}>{status}</span>;
}
