import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/quotes", label: "Quotes" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/clients", label: "Clients" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex">
      <aside className="w-56 bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-[#e5e7eb]">
          <Link href="/" className="text-lg text-[#14532d]" style={{ fontFamily: "var(--font-serif)" }}>
            TradeDesk
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 text-sm text-[#4b5563] hover:bg-[#f0fdf4] hover:text-[#14532d] rounded-lg transition-colors font-light"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#e5e7eb]">
          <a
            href="/api/auth/logout"
            className="flex items-center px-3 py-2.5 text-sm text-[#9ca3af] hover:text-[#374151] transition-colors font-light w-full"
          >
            Log out
          </a>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
