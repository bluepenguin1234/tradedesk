'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      address: fd.get('address'),
      notes: fd.get('notes'),
    };
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const { client } = await res.json();
      router.push(`/dashboard/clients/${client.id}`);
    } else {
      const j = await res.json();
      setError(j.error ?? 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-10 max-w-2xl">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>Add Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#e5e7eb] rounded-xl p-8 space-y-5">
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Name *</label>
          <input name="name" required placeholder="John Smith" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Email</label>
          <input name="email" type="email" placeholder="john@example.com" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Phone</label>
          <input name="phone" type="tel" placeholder="(555) 000-0000" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Address</label>
          <input name="address" placeholder="123 Main St, City, State" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Notes</label>
          <textarea name="notes" rows={3} placeholder="Anything worth remembering about this client…" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] resize-none" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-[#15803d] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Add client'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-full text-sm font-medium border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
