'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Client } from '@/types';

export default function Clients() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : '/api/clients';
      fetch(url).then(r => r.json()).then(d => setClients(d.clients ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: 'var(--font-serif)' }}>Clients</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">Everyone you work with, all in one place.</p>
        </div>
        <Link href="/dashboard/clients/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          Add Client →
        </Link>
      </div>
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-sm bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
        />
      </div>
      {clients === null ? (
        <Empty label="Loading…" />
      ) : clients.length === 0 ? (
        <Empty label={search ? `No clients matching "${search}".` : 'No clients yet. Add your first one.'} />
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          {clients.map((c, i) => (
            <Link
              key={c.id}
              href={`/dashboard/clients/${c.id}`}
              className={`flex items-center justify-between px-6 py-4 hover:bg-[#f9fafb] transition-colors ${i > 0 ? 'border-t border-[#f3f4f6]' : ''}`}
            >
              <div>
                <p className="text-sm text-[#0f0f0f] font-medium">{c.name}</p>
                <p className="text-xs text-[#9ca3af] mt-0.5 font-light">
                  {c.email ?? '—'}{c.phone ? ` · ${c.phone}` : ''}
                </p>
              </div>
              <span className="text-[#d1d5db] text-sm">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
      <p className="text-[#9ca3af] text-sm font-light">{label}</p>
    </div>
  );
}
