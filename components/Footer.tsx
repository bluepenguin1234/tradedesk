import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e5e7eb] px-8 py-14">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <div className="text-lg text-[#14532d] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            TradeDesk
          </div>
          <p className="text-[#9ca3af] text-sm leading-relaxed font-light">
            The admin you never had. Built for contractors.
          </p>
        </div>
        <div>
          <div className="text-xs text-[#9ca3af] uppercase tracking-widest mb-4 font-medium">Product</div>
          <div className="flex flex-col gap-3 text-sm text-[#4b5563]">
            <Link href="/#features" className="hover:text-[#14532d] transition-colors font-light">Features</Link>
            <Link href="/pricing" className="hover:text-[#14532d] transition-colors font-light">Pricing</Link>
          </div>
        </div>
        <div>
          <div className="text-xs text-[#9ca3af] uppercase tracking-widest mb-4 font-medium">Company</div>
          <div className="flex flex-col gap-3 text-sm text-[#4b5563]">
            <Link href="/about" className="hover:text-[#14532d] transition-colors font-light">About</Link>
            <Link href="/contact" className="hover:text-[#14532d] transition-colors font-light">Contact</Link>
          </div>
        </div>
        <div>
          <div className="text-xs text-[#9ca3af] uppercase tracking-widest mb-4 font-medium">Legal</div>
          <div className="flex flex-col gap-3 text-sm text-[#4b5563]">
            <Link href="/privacy" className="hover:text-[#14532d] transition-colors font-light">Privacy</Link>
            <Link href="/terms" className="hover:text-[#14532d] transition-colors font-light">Terms</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[#e5e7eb] flex items-center justify-between">
        <span className="text-sm text-[#9ca3af] font-light">© {new Date().getFullYear()} TradeDesk</span>
        <span className="text-sm text-[#9ca3af] font-light">Built for trades.</span>
      </div>
    </footer>
  );
}
