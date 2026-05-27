'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  total: number;
  due_date: string | null;
  clients: { name: string } | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(d => setInvoices(d.invoices ?? []));
  }, []);

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>Invoices</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">Track payments and outstanding balances.</p>
        </div>
        <Link href="/dashboard/invoices/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          New Invoice →
        </Link>
      </div>
      {invoices === null ? (
        <Empty label="Loading…" />
      ) : invoices.length === 0 ? (
        <Empty label="No invoices yet. Create your first one." />
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          {invoices.map((inv, i) => (
            <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className={`grid grid-cols-[120px_1fr_auto_110px] gap-4 items-center px-6 py-4 hover:bg-[#f9fafb] transition-colors ${i > 0 ? 'border-t border-[#f3f4f6]' : ''}`}>
              <span className="text-sm text-[#0f0f0f] font-medium">{inv.invoice_number ?? '—'}</span>
              <span className="text-sm text-[#6b7280] font-light truncate">
                {inv.clients?.name ?? 'No client'}{inv.due_date ? ` · due ${new Date(inv.due_date).toLocaleDateString()}` : ''}
              </span>
              <span className="text-sm text-[#0f0f0f] font-medium tabular-nums">${inv.total.toFixed(2)}</span>
              <InvoiceStatusBadge status={inv.status} />
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

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'bg-[#f3f4f6] text-[#6b7280]',
    sent: 'bg-blue-50 text-blue-700',
    paid: 'bg-[#f0fdf4] text-[#15803d]',
    overdue: 'bg-red-50 text-red-600',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors[status]} justify-self-end`}>{status}</span>;
}
