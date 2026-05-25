import Link from "next/link";

export default function Clients() {
  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: "var(--font-serif)" }}>Clients</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">Everyone you work with, all in one place.</p>
        </div>
        <Link href="/dashboard/clients/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          Add Client →
        </Link>
      </div>
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          className="w-full max-w-sm bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
        />
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
        <p className="text-[#9ca3af] text-sm font-light">No clients yet. Add your first one.</p>
      </div>
    </div>
  );
}
