import Link from 'next/link';
import type { QuoteStatus } from '@/types';

export interface QuoteCardData {
  id: string;
  quote_number: string | null;
  status: QuoteStatus;
  clients: { name: string } | null;
  total: number;
}

export function QuoteCard({ quote }: { quote: QuoteCardData }) {
  return (
    <Link
      href={`/dashboard/quotes/${quote.id}`}
      className="block bg-[#f9fafb] hover:bg-white border border-[#e5e7eb] hover:border-[#15803d] rounded-lg p-2.5 mb-2 transition-colors"
    >
      <div className="text-xs font-medium text-[#0f0f0f] leading-tight truncate">
        {quote.quote_number ?? 'Quote'}
      </div>
      <div className="text-[10px] text-[#9ca3af] font-light truncate mt-0.5">
        Quote · {quote.clients?.name ?? 'No client'}
      </div>
      {quote.total > 0 && (
        <div className="text-[11px] text-[#15803d] font-semibold mt-1 tabular-nums">
          ${quote.total.toFixed(2)}
        </div>
      )}
    </Link>
  );
}
