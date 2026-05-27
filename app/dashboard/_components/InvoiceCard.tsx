import Link from 'next/link';
import type { InvoiceStatus } from '@/types';

export interface InvoiceCardData {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  clients: { name: string } | null;
  total: number;
}

export function InvoiceCard({ invoice }: { invoice: InvoiceCardData }) {
  return (
    <Link
      href={`/dashboard/invoices/${invoice.id}`}
      className="block bg-[#f9fafb] hover:bg-white border border-[#e5e7eb] hover:border-[#15803d] rounded-lg p-2.5 mb-2 transition-colors"
    >
      <div className="text-xs font-medium text-[#0f0f0f] leading-tight truncate">
        {invoice.invoice_number ?? 'Invoice'}
      </div>
      <div className="text-[10px] text-[#9ca3af] font-light truncate mt-0.5">
        Invoice · {invoice.clients?.name ?? 'No client'}
      </div>
      <div className="text-[11px] text-[#15803d] font-semibold mt-1 tabular-nums">
        ${invoice.total.toFixed(2)}
      </div>
    </Link>
  );
}
