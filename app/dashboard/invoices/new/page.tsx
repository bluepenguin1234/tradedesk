'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LineItem { description: string; qty: number; unit_price: number; }

function calcTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  return { subtotal, total: subtotal * (1 + taxRate / 100) };
}

export default function NewInvoice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<{ id: string; quote_number: string; total: number; line_items: LineItem[]; tax_rate: number; client_id: string | null }[]>([]);
  const [items, setItems] = useState<LineItem[]>([{ description: '', qty: 1, unit_price: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [fromQuote, setFromQuote] = useState('');

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients ?? []));
    fetch('/api/quotes?status=accepted').then(r => r.json()).then(d => setAcceptedQuotes(d.quotes ?? []));
  }, []);

  function handleQuoteSelect(quoteId: string) {
    setFromQuote(quoteId);
    if (!quoteId) return;
    const q = acceptedQuotes.find(q => q.id === quoteId);
    if (q) {
      setItems(q.line_items);
      setTaxRate(q.tax_rate);
    }
  }

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', qty: 1, unit_price: 0 }]);
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  const { subtotal, total } = calcTotals(items, taxRate);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const selectedQuote = acceptedQuotes.find(q => q.id === fromQuote);
    const body = {
      client_id: fd.get('client_id') || selectedQuote?.client_id || null,
      quote_id: fromQuote || null,
      line_items: items.filter(i => i.description.trim()),
      tax_rate: taxRate,
      due_date: fd.get('due_date') || null,
      notes: fd.get('notes'),
    };
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Something went wrong.');
      setLoading(false);
      return;
    }
    const { invoice } = await res.json();
    router.push(`/dashboard/invoices/${invoice.id}`);
  }

  return (
    <div className="px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From quote or scratch */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5">
          {acceptedQuotes.length > 0 && (
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">From accepted quote (optional)</label>
              <select value={fromQuote} onChange={e => handleQuoteSelect(e.target.value)} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
                <option value="">Start from scratch</option>
                {acceptedQuotes.map(q => <option key={q.id} value={q.id}>{q.quote_number} — ${q.total.toFixed(2)}</option>)}
              </select>
            </div>
          )}
          {!fromQuote && (
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Client</label>
              <select name="client_id" defaultValue="" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
                <option value="">No client selected</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Due date</label>
            <input name="due_date" type="date" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
          <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-4">Line items</p>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_110px_36px] gap-2 items-center">
                <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
                <input type="number" min="1" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} placeholder="Qty" className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] text-center" />
                <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} placeholder="Unit price" className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
                <button type="button" onClick={() => removeItem(i)} className="text-[#d1d5db] hover:text-red-400 transition-colors text-lg leading-none">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-3 text-sm text-[#15803d] hover:text-[#14532d] transition-colors font-medium">+ Add line item</button>

          <div className="border-t border-[#f3f4f6] mt-6 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#6b7280]">Tax rate (%)</span>
              <input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-24 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm text-right text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
            </div>
            <div className="flex justify-between text-sm text-[#6b7280]"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {taxRate > 0 && <div className="flex justify-between text-sm text-[#6b7280]"><span>Tax</span><span>${(total - subtotal).toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold text-[#0f0f0f]"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-6">
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Notes</label>
          <textarea name="notes" rows={3} placeholder="Payment terms, job details, anything for the client…" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] resize-none" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-[#15803d] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Create invoice'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-full text-sm font-medium border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
