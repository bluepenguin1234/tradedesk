'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Client, Quote, Invoice, Project } from '@/types';

interface DetailData {
  client: Client;
  quotes: Quote[];
  invoices: Invoice[];
  projects: Project[];
}

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DetailData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(async r => {
      if (!r.ok) { setError('Client not found.'); return; }
      const d = await r.json();
      setData(d);
      setForm({
        name: d.client.name ?? '',
        email: d.client.email ?? '',
        phone: d.client.phone ?? '',
        address: d.client.address ?? '',
        notes: d.client.notes ?? '',
      });
    });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Could not save.');
      return;
    }
    const { client } = await res.json();
    setData(d => d ? { ...d, client } : d);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this client? Their quotes, invoices, and projects will lose the client link.')) return;
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Could not delete.');
      return;
    }
    router.push('/dashboard/clients');
  }

  if (error && !data) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <Link href="/dashboard/clients" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to clients</Link>
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
          <p className="text-[#9ca3af] text-sm font-light">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
          <p className="text-[#9ca3af] text-sm font-light">Loading…</p>
        </div>
      </div>
    );
  }

  const { client, quotes, invoices, projects } = data;

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link href="/dashboard/clients" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to clients</Link>

      <div className="flex items-center justify-between mb-8 mt-2 gap-4">
        <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>
          {client.name}
        </h1>
        {!editing && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="text-sm px-4 py-2 rounded-full border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] hover:text-[#0f0f0f] transition-colors font-medium">Edit</button>
            <button onClick={handleDelete} className="text-sm px-4 py-2 rounded-full border border-[#fee2e2] text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors font-medium">Delete</button>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5 mb-8">
        {editing ? (
          <>
            <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
            <Field label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} type="tel" />
            <Field label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} />
            <FieldTextarea label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="bg-[#15803d] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => {
                setEditing(false); setError('');
                setForm({ name: client.name, email: client.email ?? '', phone: client.phone ?? '', address: client.address ?? '', notes: client.notes ?? '' });
              }} className="px-6 py-2.5 rounded-full text-sm font-medium border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <ReadField label="Email" value={client.email} />
            <ReadField label="Phone" value={client.phone} />
            <ReadField label="Address" value={client.address} />
            <ReadField label="Notes" value={client.notes} multiline />
          </>
        )}
      </div>

      <RelatedSection title="Projects" items={projects} hrefPrefix="/dashboard/projects" render={p => `${p.name} — ${p.status.replace('_', ' ')}`} />
      <RelatedSection title="Quotes" items={quotes} hrefPrefix="/dashboard/quotes" render={q => `${q.quote_number ?? 'Quote'} — $${q.total.toFixed(2)} (${q.status})`} />
      <RelatedSection title="Invoices" items={invoices} hrefPrefix="/dashboard/invoices" render={inv => `${inv.invoice_number ?? 'Invoice'} — $${inv.total.toFixed(2)} (${inv.status})`} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
    </div>
  );
}

function FieldTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">{label}</label>
      <textarea value={value} rows={3} onChange={e => onChange(e.target.value)} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] resize-none" />
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

function RelatedSection<T extends { id: string }>({ title, items, hrefPrefix, render }: { title: string; items: T[]; hrefPrefix: string; render: (item: T) => string }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm text-[#6b7280] uppercase tracking-widest font-medium mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#9ca3af] font-light">None yet.</p>
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          {items.map((item, i) => (
            <Link key={item.id} href={`${hrefPrefix}/${item.id}`} className={`block px-5 py-3 text-sm text-[#0f0f0f] hover:bg-[#f9fafb] transition-colors ${i > 0 ? 'border-t border-[#f3f4f6]' : ''}`}>
              {render(item)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
