'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { InvoiceStatus } from '@/types';

export interface InvoiceCardData {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  clients: { name: string } | null;
  total: number;
}

export function InvoiceCard({ invoice }: { invoice: InvoiceCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSend(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const clientName = invoice.clients?.name ?? 'the client';
    if (!confirm(`Send this invoice to ${clientName}? They'll get a Stripe payment link.`)) return;
    setBusy(true);
    const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      return;
    }
    const j = await res.json().catch(() => ({}));
    if (j.code === 'connect_required') {
      if (confirm(`${j.error}\n\nWould you like to connect Stripe now?`)) {
        window.location.href = '/api/stripe/connect';
      }
      return;
    }
    alert(j.error ?? 'Could not send the invoice.');
  }

  return (
    <div className="group relative bg-[#f9fafb] hover:bg-white border border-[#e5e7eb] hover:border-[#15803d] rounded-lg p-2.5 mb-2 transition-colors">
      <Link href={`/dashboard/invoices/${invoice.id}`} className="block">
        <div className="text-xs font-medium text-[#0f0f0f] leading-tight truncate pr-12">
          {invoice.invoice_number ?? 'Invoice'}
        </div>
        <div className="text-[10px] text-[#9ca3af] font-light truncate mt-0.5">
          Invoice · {invoice.clients?.name ?? 'No client'}
        </div>
        <div className="text-[11px] text-[#15803d] font-semibold mt-1 tabular-nums">
          ${invoice.total.toFixed(2)}
        </div>
      </Link>
      {invoice.status === 'draft' && (
        <button
          onClick={handleSend}
          disabled={busy}
          title="Send to client"
          aria-label="Send to client"
          className="absolute top-1.5 right-1.5 bg-[#15803d] text-white text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#14532d] disabled:opacity-50"
        >
          {busy ? '…' : 'Send'}
        </button>
      )}
    </div>
  );
}
