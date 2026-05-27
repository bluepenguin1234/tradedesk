'use client';

import { useEffect, useState } from 'react';
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

interface ProjectRow {
  id: string;
  name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  clients: { name: string } | null;
}

export default function Projects() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [filter, setFilter] = useState<ProjectStatus | null>(null);

  useEffect(() => {
    const url = filter ? `/api/projects?status=${filter}` : '/api/projects';
    fetch(url).then(r => r.json()).then(d => setProjects(d.projects ?? []));
  }, [filter]);

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>Projects</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">Every job from first inquiry to final payment.</p>
        </div>
        <Link href="/dashboard/projects/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          New Project →
        </Link>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <Chip active={filter === null} onClick={() => setFilter(null)}>All</Chip>
        {STATUSES.map(s => (
          <Chip key={s.value} active={filter === s.value} onClick={() => setFilter(s.value)}>{s.label}</Chip>
        ))}
      </div>
      {projects === null ? (
        <Empty label="Loading…" />
      ) : projects.length === 0 ? (
        <Empty label={filter ? `No projects with that status.` : 'No projects yet. Create your first one.'} />
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          {projects.map((p, i) => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} className={`flex items-center justify-between px-6 py-4 hover:bg-[#f9fafb] transition-colors ${i > 0 ? 'border-t border-[#f3f4f6]' : ''}`}>
              <div>
                <p className="text-sm text-[#0f0f0f] font-medium">{p.name}</p>
                <p className="text-xs text-[#9ca3af] mt-0.5 font-light">
                  {p.clients?.name ?? 'No client'}{p.start_date ? ` · started ${new Date(p.start_date).toLocaleDateString()}` : ''}
                </p>
              </div>
              <ProjectStatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${active ? 'border-[#15803d] text-[#15803d] bg-[#f0fdf4]' : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#15803d] hover:text-[#15803d]'}`}>
      {children}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
      <p className="text-[#9ca3af] text-sm font-light">{label}</p>
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
