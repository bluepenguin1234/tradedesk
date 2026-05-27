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
  client_id: string | null;
  clients: { name: string; email: string | null } | null;
  projects: { name: string } | null;
}

interface EditForm {
  client_id: string;
  due_date: string;
  line_items: LineItem[];
  tax_rate: number;
  notes: string;
}

function calcTotals(items: LineItem[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  return { subtotal, total: subtotal * (1 + taxRate / 100) };
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    client_id: '', due_date: '', line_items: [], tax_rate: 0, notes: '',
  });

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(async r => {
      if (!r.ok) { setError('Invoice not found.'); return; }
      const { invoice } = await r.json();
      setInvoice(invoice);
      setForm({
        client_id: invoice.client_id ?? '',
        due_date: invoice.due_date ?? '',
        line_items: invoice.line_items.length ? invoice.line_items : [{ description: '', qty: 1, unit_price: 0 }],
        tax_rate: invoice.tax_rate,
        notes: invoice.notes ?? '',
      });
    });
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients ?? []));
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

  async function handleSend() {
    if (!confirm(`Send this invoice to ${invoice?.clients?.name ?? 'the client'}? They'll get an email with a Stripe payment link.`)) return;
    setBusy(true);
    setError('');
    setErrorCode('');
    const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Could not send.');
      setErrorCode(j.code ?? '');
      return;
    }
    const fresh = await fetch(`/api/invoices/${id}`).then(r => r.json());
    setInvoice(fresh.invoice);
  }

  async function handleSave() {
    setBusy(true);
    setError('');
    const cleanItems = form.line_items.filter(i => i.description.trim());
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: form.client_id || null,
        due_date: form.due_date || null,
        notes: form.notes || null,
        line_items: cleanItems,
        tax_rate: form.tax_rate,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Could not save.');
      return;
    }
    const fresh = await fetch(`/api/invoices/${id}`).then(r => r.json());
    setInvoice(fresh.invoice);
    setEditing(false);
  }

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setForm(prev => ({ ...prev, line_items: prev.line_items.map((it, idx) => idx === i ? { ...it, [field]: value } : it) }));
  }
  function addItem() {
    setForm(prev => ({ ...prev, line_items: [...prev.line_items, { description: '', qty: 1, unit_price: 0 }] }));
  }
  function removeItem(i: number) {
    setForm(prev => ({ ...prev, line_items: prev.line_items.filter((_, idx) => idx !== i) }));
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

  const editTotals = calcTotals(form.line_items, form.tax_rate);

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link href="/dashboard/invoices" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to invoices</Link>

      <div className="flex items-center justify-between mb-8 mt-2 gap-4">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>{invoice.invoice_number ?? 'Invoice'}</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">{invoice.clients?.name ?? 'No client'}</p>
        </div>
        {!editing && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <InvoiceStatusBadge status={invoice.status} />
            {invoice.status === 'draft' && (
              <>
                <button onClick={() => setEditing(true)} className="text-sm px-4 py-2 rounded-full border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] hover:text-[#0f0f0f] transition-colors font-medium">Edit</button>
                <button onClick={handleSend} disabled={busy} className="text-sm px-4 py-2 rounded-full bg-[#15803d] text-white hover:bg-[#14532d] transition-colors font-medium disabled:opacity-50">
                  {busy ? 'Sending…' : 'Send to client'}
                </button>
              </>
            )}
            {invoice.status !== 'paid' && invoice.status !== 'draft' && (
              <button onClick={() => changeStatus('paid')} disabled={busy} className="text-sm px-4 py-2 rounded-full bg-[#15803d] text-white hover:bg-[#14532d] transition-colors font-medium disabled:opacity-50">
                Mark paid
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-red-600 text-sm">
            {error}
            {errorCode === 'connect_required' && (
              <> <a href="/api/stripe/connect" className="underline font-medium hover:text-red-700">Connect Stripe now →</a></>
            )}
          </p>
        </div>
      )}

      {editing ? (
        <>
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5 mb-6">
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Client</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Due date</label>
              <input type="date" value={form.due_date ? form.due_date.slice(0, 10) : ''} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6">
            <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-4">Line items</p>
            <div className="space-y-3">
              {form.line_items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_110px_28px] gap-2 items-center">
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
                <input type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })} className="w-24 border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-sm text-right text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
              </div>
              <div className="flex justify-between text-sm text-[#6b7280]"><span>Subtotal</span><span className="tabular-nums">${editTotals.subtotal.toFixed(2)}</span></div>
              {form.tax_rate > 0 && <div className="flex justify-between text-sm text-[#6b7280]"><span>Tax</span><span className="tabular-nums">${(editTotals.total - editTotals.subtotal).toFixed(2)}</span></div>}
              <div className="flex justify-between font-semibold text-[#0f0f0f]"><span>Total</span><span className="tabular-nums">${editTotals.total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-6">
            <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Notes</label>
            <textarea value={form.notes} rows={3} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={busy} className="bg-[#15803d] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button>
            <button onClick={() => { setEditing(false); setError(''); }} className="px-6 py-2.5 rounded-full text-sm font-medium border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors">Cancel</button>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

function ReadField({ label, value, multiline = false }: { label: string; value: string | null; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">{label}</p>
      <p className={`text-sm text-[#0f0f0f] font-light ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value || <span className="text-[#d1d5df]">—</span>}
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
