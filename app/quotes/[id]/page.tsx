export default function PublicQuote({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-white px-8 py-16 max-w-2xl mx-auto">
      <div className="text-lg text-[#14532d] mb-8" style={{ fontFamily: "var(--font-serif)" }}>
        TradeDesk
      </div>
      <div className="border border-[#e5e7eb] rounded-2xl p-8">
        <p className="text-sm text-[#9ca3af] font-light">Loading quote {params.id}…</p>
      </div>
    </div>
  );
}
