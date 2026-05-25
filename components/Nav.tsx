import Link from "next/link";

export default function Nav() {
  return (
    <nav className="bg-white border-b border-[#e5e7eb] px-8 py-5 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="font-serif text-xl text-[#14532d] tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
        TradeDesk
      </Link>
      <div className="hidden md:flex items-center gap-10 text-sm text-[#4b5563] font-light" style={{ fontFamily: "var(--font-sans)" }}>
        <Link href="/#features" className="hover:text-[#14532d] transition-colors">Features</Link>
        <Link href="/pricing" className="hover:text-[#14532d] transition-colors">Pricing</Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm text-[#4b5563] hover:text-[#14532d] transition-colors font-light">
          Log in
        </Link>
        <Link href="/sign-up" className="text-sm bg-[#15803d] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#14532d] transition-colors">
          Try free →
        </Link>
      </div>
    </nav>
  );
}
