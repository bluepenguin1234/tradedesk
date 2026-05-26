'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const statuses = [
  { value: 'lead', label: 'Lead' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
];

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      client_id: fd.get('client_id') || null,
      status: fd.get('status'),
      start_date: fd.get('start_date') || null,
      end_date: fd.get('end_date') || null,
      notes: fd.get('notes'),
    };
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const { project } = await res.json();
      router.push(`/dashboard/projects/${project.id}`);
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
        <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#e5e7eb] rounded-xl p-8 space-y-5">
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Project name *</label>
          <input name="name" required placeholder="Kitchen remodel — Johnson" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Client</label>
          <select name="client_id" defaultValue="" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
            <option value="">No client selected</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Status</label>
          <select name="status" defaultValue="lead" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Start date</label>
            <input name="start_date" type="date" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
          </div>
          <div>
            <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">End date</label>
            <input name="end_date" type="date" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Notes</label>
          <textarea name="notes" rows={3} placeholder="Job details, scope, anything relevant…" className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] resize-none" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-[#15803d] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Create project'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-full text-sm font-medium border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
