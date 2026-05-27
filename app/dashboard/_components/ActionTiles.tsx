import Link from 'next/link';

const tiles = [
  { href: '/dashboard/quotes/new', label: 'New Quote', icon: '＋', primary: true },
  { href: '/dashboard/invoices/new', label: 'New Invoice', icon: '＄', primary: false },
  { href: '/dashboard/clients/new', label: 'Add Client', icon: '☺', primary: false },
];

export function ActionTiles() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
      {tiles.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex flex-col items-center justify-center text-center rounded-xl border px-3 py-4 sm:py-5 min-h-[80px] sm:min-h-[100px] transition-colors ${
            t.primary
              ? 'bg-[#15803d] border-[#15803d] text-white hover:bg-[#14532d]'
              : 'bg-white border-[#e5e7eb] text-[#0f0f0f] hover:bg-[#f0fdf4] hover:border-[#15803d]'
          }`}
        >
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base mb-1.5 sm:mb-2 ${
              t.primary ? 'bg-white/20 text-white' : 'bg-[#f0fdf4] text-[#15803d]'
            }`}
          >
            {t.icon}
          </div>
          <span className="text-[11px] sm:text-sm font-medium">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
