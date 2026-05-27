import Link from 'next/link';

const tiles = [
  { href: '/dashboard/quotes/new', label: 'New Quote', icon: '＋', primary: true },
  { href: '/dashboard/invoices/new', label: 'New Invoice', icon: '＄', primary: false },
  { href: '/dashboard/clients/new', label: 'Add Client', icon: '☺', primary: false },
];

export function ActionTiles() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
      {tiles.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex flex-col items-center justify-center text-center rounded-2xl border px-4 py-7 min-h-[130px] transition-colors ${
            t.primary
              ? 'bg-[#15803d] border-[#15803d] text-white hover:bg-[#14532d]'
              : 'bg-white border-[#e5e7eb] text-[#0f0f0f] hover:bg-[#f0fdf4] hover:border-[#15803d]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg mb-3 ${
              t.primary ? 'bg-white/20 text-white' : 'bg-[#f0fdf4] text-[#15803d]'
            }`}
          >
            {t.icon}
          </div>
          <span className="text-sm font-medium">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
