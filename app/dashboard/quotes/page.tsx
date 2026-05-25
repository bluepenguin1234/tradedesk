import Link from "next/link";

export default function Quotes() {
  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: "var(--font-serif)" }}>Quotes</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">All your quotes in one place.</p>
        </div>
        <Link href="/dashboard/quotes/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          New Quote →
        </Link>
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
        <p className="text-[#9ca3af] text-sm font-light">No quotes yet. Create your first one.</p>
      </div>
    </div>
  );
}
