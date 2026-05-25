'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LineItem } from '@/types';

interface QuoteData {
  id: string;
  quote_number: string;
  status: string;
  line_items: LineItem[];
  tax_rate: number;
  subtotal: number;
  total: number;
  notes: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  accepted_name: string | null;
  clients: { name: string; email: string } | null;
  profiles: { first_name: string; last_name: string; trade: string; business_name: string | null } | null;
}

export default function PublicQuotePage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sigName, setSigName] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`/api/quotes/${id}/public`)
      .then((r) => r.json())
      .then((data) => {
        if (data.quote) setQuote(data.quote);
        else setError('Quote not found.');
      })
      .catch(() => setError('Failed to load quote.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAccept() {
    if (!sigName.trim()) return;
    setAccepting(true);
    const res = await fetch(`/api/quotes/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted_name: sigName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setAccepted(true);
      setQuote((q) => q ? { ...q, status: 'accepted', accepted_name: sigName.trim(), accepted_at: new Date().toISOString() } : q);
    } else {
      setError(data.error ?? 'Something went wrong. Please try again.');
    }
    setAccepting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#9ca3af] text-sm">Loading quote…</p>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!quote) return null;

  const isExpired = quote.expires_at && new Date(quote.expires_at) < new Date();
  const isAccepted = quote.status === 'accepted';
  const isDeclined = quote.status === 'declined';
  const contractorName = `${quote.profiles?.first_name ?? ''} ${quote.profiles?.last_name ?? ''}`.trim();
  const businessName = quote.profiles?.business_name ?? contractorName;

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#9ca3af] uppercase tracking-widest mb-1">Quote from</p>
          <h1 className="text-2xl font-medium text-[#0f0f0f]">{businessName}</h1>
          {quote.profiles?.trade && <p className="text-sm text-[#6b7280]">{quote.profiles.trade}</p>}
        </div>

        {/* Quote card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden mb-6">
          {/* Quote meta */}
          <div className="px-8 py-6 border-b border-[#f3f4f6]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#9ca3af] uppercase tracking-widest mb-1">Quote number</p>
                <p className="font-medium text-[#0f0f0f]">{quote.quote_number}</p>
              </div>
              {quote.expires_at && (
                <div className="text-right">
                  <p className="text-xs text-[#9ca3af] uppercase tracking-widest mb-1">Expires</p>
                  <p className={`text-sm font-medium ${isExpired ? 'text-red-500' : 'text-[#0f0f0f]'}`}>
                    {new Date(quote.expires_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="px-8 py-6">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[#9ca3af] uppercase tracking-widest border-b border-[#f3f4f6]">
                  <th className="text-left pb-3 font-medium">Description</th>
                  <th className="text-right pb-3 font-medium">Qty</th>
                  <th className="text-right pb-3 font-medium">Unit Price</th>
                  <th className="text-right pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {quote.line_items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-sm text-[#374151]">{item.description}</td>
                    <td className="py-3 text-sm text-[#374151] text-right">{item.qty}</td>
                    <td className="py-3 text-sm text-[#374151] text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 text-sm text-[#374151] text-right">${(item.qty * item.unit_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-[#e5e7eb] mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-[#6b7280]">
                <span>Subtotal</span>
                <span>${quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.tax_rate > 0 && (
                <div className="flex justify-between text-sm text-[#6b7280]">
                  <span>Tax ({quote.tax_rate}%)</span>
                  <span>${(quote.total - quote.subtotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-[#0f0f0f] text-base pt-1">
                <span>Total</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="px-8 pb-6">
              <p className="text-xs text-[#9ca3af] uppercase tracking-widest mb-2">Notes</p>
              <p className="text-sm text-[#374151]">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Status / Accept section */}
        {isAccepted ? (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-[#15803d] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-[#14532d] mb-1">Quote accepted</h2>
            <p className="text-sm text-[#166534]">
              Signed by <strong>{quote.accepted_name}</strong>
              {quote.accepted_at && ` on ${new Date(quote.accepted_at).toLocaleDateString()}`}
            </p>
            <p className="text-sm text-[#166534] mt-2">{contractorName} will be in touch shortly.</p>
          </div>
        ) : isDeclined ? (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-8 text-center">
            <p className="text-sm text-red-600">This quote has been declined.</p>
          </div>
        ) : isExpired ? (
          <div className="bg-[#fef9ec] border border-[#fde68a] rounded-2xl p-8 text-center">
            <p className="text-sm text-amber-700">This quote has expired. Contact {contractorName} for a new one.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8">
            {accepted ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-[#15803d] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-[#14532d] mb-1">Quote accepted</h2>
                <p className="text-sm text-[#6b7280]">{contractorName} will be in touch shortly.</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-medium text-[#0f0f0f] mb-1">Accept this quote</h2>
                <p className="text-sm text-[#6b7280] mb-6">Type your full name below as your electronic signature.</p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="mb-4">
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-widest mb-2">Full name (signature)</label>
                  <input
                    type="text"
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]"
                  />
                </div>
                <button
                  onClick={handleAccept}
                  disabled={!sigName.trim() || accepting}
                  className="w-full bg-[#15803d] text-white py-3.5 rounded-full font-medium text-sm hover:bg-[#14532d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting ? 'Accepting…' : `Accept Quote — $${quote.total.toFixed(2)}`}
                </button>
                <p className="text-center text-[#9ca3af] text-xs mt-4">
                  By clicking Accept, you agree to the quoted total and authorize {contractorName} to proceed.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
