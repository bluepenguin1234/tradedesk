'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type ProjectStatus = 'lead' | 'quoted' | 'in_progress' | 'complete' | 'invoiced' | 'paid';

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
];

interface ProjectDetail {
  id: string;
  name: string;
  status: ProjectStatus;
  client_id: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  clients: { name: string; email: string | null; phone: string | null } | null;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', status: 'lead' as ProjectStatus, client_id: '' as string,
    start_date: '', end_date: '', notes: '',
  });

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(async r => {
      if (!r.ok) { setError('Project not found.'); return; }
      const { project } = await r.json();
      setProject(project);
      setForm({
        name: project.name,
        status: project.status,
        client_id: project.client_id ?? '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        notes: project.notes ?? '',
      });
    });
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients ?? []));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        status: form.status,
        client_id: form.client_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? 'Could not save.');
      return;
    }
    const { project: updated } = await res.json();
    setProject(prev => prev ? { ...prev, ...updated } : updated);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this project?')) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json(); setError(j.error ?? 'Could not delete.'); return; }
    router.push('/dashboard/projects');
  }

  if (error && !project) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <Link href="/dashboard/projects" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to projects</Link>
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center"><p className="text-[#9ca3af] text-sm font-light">{error}</p></div>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="px-8 py-10 max-w-3xl">
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center"><p className="text-[#9ca3af] text-sm font-light">Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 max-w-3xl">
      <Link href="/dashboard/projects" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors mb-4 inline-flex items-center gap-1">← Back to projects</Link>

      <div className="flex items-center justify-between mb-8 mt-2 gap-4">
        <h1 className="text-3xl text-[#0f0f0f] truncate" style={{ fontFamily: 'var(--font-serif)' }}>{project.name}</h1>
        {!editing && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="text-sm px-4 py-2 rounded-full border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] hover:text-[#0f0f0f] transition-colors font-medium">Edit</button>
            <button onClick={handleDelete} className="text-sm px-4 py-2 rounded-full border border-[#fee2e2] text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors font-medium">Delete</button>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5">
        {editing ? (
          <>
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Client</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Start date</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
              </div>
              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">End date</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-2">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d] resize-none" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="bg-[#15803d] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setEditing(false)} className="px-6 py-2.5 rounded-full text-sm font-medium border border-[#e5e7eb] text-[#6b7280] hover:border-[#0f0f0f] transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium">Status</span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <ReadField label="Client" value={project.clients?.name ?? null} />
            <div className="grid grid-cols-2 gap-4">
              <ReadField label="Start date" value={project.start_date ? new Date(project.start_date).toLocaleDateString() : null} />
              <ReadField label="End date" value={project.end_date ? new Date(project.end_date).toLocaleDateString() : null} />
            </div>
            <ReadField label="Notes" value={project.notes} multiline />
          </>
        )}
      </div>
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

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const colors: Record<ProjectStatus, string> = {
    lead: 'bg-[#f3f4f6] text-[#6b7280]',
    quoted: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-amber-50 text-amber-700',
    complete: 'bg-purple-50 text-purple-700',
    invoiced: 'bg-indigo-50 text-indigo-700',
    paid: 'bg-[#f0fdf4] text-[#15803d]',
  };
  const labels: Record<ProjectStatus, string> = {
    lead: 'Lead', quoted: 'Quoted', in_progress: 'In Progress', complete: 'Complete', invoiced: 'Invoiced', paid: 'Paid',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[status]}`}>{labels[status]}</span>;
}
