'use client';

import { PipelineCard, type CardProject } from './PipelineCard';
import { PIPELINE_COLUMNS, statusToColumn } from '@/lib/pipeline';

export type PipelineProject = CardProject;

export function Pipeline({ projects }: { projects: PipelineProject[] }) {
  const groups = PIPELINE_COLUMNS.map(col => ({
    column: col,
    projects: projects.filter(p => statusToColumn(p.status) === col),
  }));

  // "In flight" = anything not yet paid
  const inFlight = projects
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-[#6b7280] uppercase tracking-[0.15em] font-medium">Pipeline</span>
        <span className="text-xs text-[#9ca3af] font-light tabular-nums">
          {projects.length} {projects.length === 1 ? 'job' : 'jobs'} · ${inFlight.toFixed(2)} in flight
        </span>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-4 mb-10 overflow-x-auto">
        <div className="grid grid-cols-5 gap-3 min-w-[640px]">
          {groups.map(g => (
            <div key={g.column}>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-[0.12em] font-medium text-center pb-2 mb-2 border-b border-[#f3f4f6]">
                {g.column}
                <span className="ml-1.5 inline-block bg-[#f3f4f6] text-[9px] px-1.5 py-0.5 rounded-full">{g.projects.length}</span>
              </div>
              <div className="min-h-[120px] px-0.5">
                {g.projects.length === 0 ? (
                  <p className="text-[11px] text-[#d1d5db] italic text-center pt-3">—</p>
                ) : (
                  g.projects.map(p => <PipelineCard key={p.id} project={p} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
