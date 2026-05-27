'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Suggestion } from '@/lib/coach';

export function Coach({ suggestions }: { suggestions: Suggestion[] }) {
  const [index, setIndex] = useState(0);
  if (suggestions.length === 0) return null;
  const s = suggestions[index % suggestions.length];

  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs text-[#6b7280] uppercase tracking-[0.15em] font-medium">Today&apos;s focus</span>
        <span className="text-xs text-[#9ca3af] font-light">picked from your data</span>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-7 text-center">
        <p
          className="text-[#0f0f0f] mx-auto max-w-xl leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)', fontSize: '20px' }}
        >
          {s.parts.map((p, i) =>
            p.type === 'em'
              ? <em key={i} className="not-italic text-[#15803d] font-medium">{p.text}</em>
              : <span key={i}>{p.text}</span>
          )}
        </p>
        <Link
          href={s.ctaHref}
          className="inline-block mt-5 bg-[#15803d] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors"
        >
          {s.ctaLabel}
        </Link>
        {suggestions.length > 1 && (
          <button
            onClick={() => setIndex(i => (i + 1) % suggestions.length)}
            className="block mx-auto mt-4 text-xs text-[#9ca3af] hover:text-[#0f0f0f] underline font-light"
          >
            Show me a different focus
          </button>
        )}
      </div>
    </>
  );
}
