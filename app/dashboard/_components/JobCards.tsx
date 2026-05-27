'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JobCard, JobColumn } from '@/lib/jobs';

const sections: { column: JobColumn; label: string; sub: string }[] = [
  { column: 'todo', label: 'To Do', sub: 'your turn' },
  { column: 'waiting', label: 'Waiting', sub: 'their turn' },
  { column: 'done', label: 'Done', sub: 'this month' },
];

export function JobCards({ cards }: { cards: JobCard[] }) {
  const grouped: Record<JobColumn, JobCard[]> = {
    todo: cards.filter(c => c.column === 'todo'),
    waiting: cards.filter(c => c.column === 'waiting'),
    done: cards.filter(c => c.column === 'done'),
  };

  return (
    <>
      {sections.map(section => (
        <section key={section.column} className="mb-7">
          <div className="flex items-baseline justify-between px-1 pb-2 mb-2 border-b border-[#e5e7eb]">
            <div>
              <span className="text-xs text-[#0f0f0f] font-semibold uppercase tracking-[0.1em]">{section.label}</span>
              <span className="ml-1.5 text-[10px] text-[#9ca3af] font-light">· {section.sub}</span>
            </div>
            <span className="text-[10px] text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full">
              {grouped[section.column].length}
            </span>
          </div>

          {grouped[section.column].length === 0 ? (
            <p className="text-[11px] text-[#d1d5db] italic text-center py-4">—</p>
          ) : (
            <div className="space-y-2">
              {grouped[section.column].map(card => {
                if (card.column === 'todo') return <TodoCardView key={card.key} card={card} />;
                if (card.column === 'waiting') return <WaitingCardView key={card.key} card={card} />;
                return <DoneCardView key={card.key} card={card} />;
              })}
            </div>
          )}
        </section>
      ))}
    </>
  );
}

function TodoCardView({ card }: { card: JobCard }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-3.5">
      <Link href={card.detailHref} className="block">
        <div className="text-sm font-medium text-[#0f0f0f]">{card.clientName}</div>
        <div className="text-[11px] text-[#9ca3af] font-light mt-0.5 mb-3">{card.context}</div>
      </Link>
      {card.primary && (
        <Link
          href={card.primary.href}
          className="block w-full text-center bg-[#15803d] text-white py-2.5 rounded-full text-[13px] font-medium hover:bg-[#14532d] transition-colors"
        >
          {card.primary.label}
        </Link>
      )}
    </div>
  );
}

function WaitingCardView({ card }: { card: JobCard }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleNudge(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!card.nudge) return;
    setBusy(true);
    const res = await fetch(card.nudge.endpoint, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      setSent(true);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? 'Could not send the reminder.');
    }
  }

  return (
    <div className="bg-[#f9fafb] border border-dashed border-[#e5e7eb] rounded-xl p-3 hover:bg-white transition-colors">
      <Link href={card.detailHref} className="block">
        <div className="text-[13px] font-medium text-[#6b7280]">{card.clientName}</div>
        <div className="text-[11px] text-[#9ca3af] font-light mt-0.5">{card.context}</div>
      </Link>
      {card.nudge && (
        <button
          onClick={handleNudge}
          disabled={busy || sent}
          className="mt-2 text-[11px] text-[#6b7280] hover:text-[#0f0f0f] underline disabled:no-underline disabled:opacity-60"
        >
          {sent ? 'Reminder sent ✓' : busy ? 'Sending…' : card.nudge.label}
        </button>
      )}
    </div>
  );
}

function DoneCardView({ card }: { card: JobCard }) {
  return (
    <Link
      href={card.detailHref}
      className="block bg-[#f0fdf4] border border-[#d1fae5] rounded-xl p-3 hover:bg-[#dcfce7] transition-colors"
    >
      <div className="text-[13px] font-medium text-[#14532d]">{card.clientName}</div>
      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-[13px] text-[#15803d] font-semibold tabular-nums">
          {card.amount !== null ? `$${card.amount.toFixed(2)} paid` : card.context}
        </span>
        {card.ago && <span className="text-[10px] text-[#6b7280] font-light capitalize">{card.ago}</span>}
      </div>
    </Link>
  );
}
