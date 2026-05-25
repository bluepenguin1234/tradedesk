export default function QuoteDetail({ params }: { params: { id: string } }) {
  return (
    <div className="px-8 py-10 max-w-3xl">
      <h1 className="text-3xl text-[#0f0f0f] mb-8" style={{ fontFamily: "var(--font-serif)" }}>Quote</h1>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-8">
        <p className="text-[#9ca3af] text-sm font-light">Quote {params.id} — coming soon.</p>
      </div>
    </div>
  );
}
