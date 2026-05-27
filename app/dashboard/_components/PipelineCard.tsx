'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { ProjectStatus } from '@/types';
import { nextStatus, ALL_STATUSES } from '@/lib/pipeline';

export interface CardProject {
  id: string;
  name: string;
  status: ProjectStatus;
  clients: { name: string } | null;
  amount: number | null;
}

export function PipelineCard({ project }: { project: CardProject }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const next = nextStatus(project.status);

  // Close popover on outside click
  useEffect(() => {
    if (!pillOpen) return;
    const handler = () => setPillOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [pillOpen]);

  async function setStatus(status: ProjectStatus) {
    setBusy(true);
    setPillOpen(false);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="group relative bg-[#f9fafb] hover:bg-white border border-[#e5e7eb] hover:border-[#15803d] rounded-lg p-2.5 mb-2 transition-colors">
      <Link href={`/dashboard/projects/${project.id}`} className="block">
        <div className="text-xs font-medium text-[#0f0f0f] leading-tight pr-6 truncate">{project.name}</div>
        <div className="text-[10px] text-[#9ca3af] font-light truncate mt-0.5">{project.clients?.name ?? 'No client'}</div>
        {project.amount !== null && (
          <div className="text-[11px] text-[#15803d] font-semibold mt-1 tabular-nums">${project.amount.toFixed(2)}</div>
        )}
      </Link>

      {next && (
        <button
          onClick={e => { e.stopPropagation(); e.preventDefault(); setStatus(next); }}
          disabled={busy}
          title={`Advance to ${ALL_STATUSES.find(s => s.value === next)?.label}`}
          aria-label="Advance to next stage"
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white border border-[#e5e7eb] text-[#9ca3af] hover:text-[#15803d] hover:border-[#15803d] flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 leading-none"
        >
          →
        </button>
      )}

      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); setPillOpen(o => !o); }}
        title="Change status"
        aria-label="Change status"
        className="absolute bottom-1.5 right-1.5 text-[10px] text-[#d1d5db] hover:text-[#0f0f0f] opacity-0 group-hover:opacity-100 transition-opacity leading-none"
      >
        •••
      </button>

      {pillOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute z-10 top-full right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-1 min-w-[130px]"
        >
          {ALL_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`block w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${s.value === project.status ? 'bg-[#f0fdf4] text-[#15803d] font-medium' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0f0f0f]'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
