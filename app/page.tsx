import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const features = [
  { n: "01", title: "Quote Builder", desc: "Create and send branded quotes in minutes. Clients review and sign online. No more Word docs or chasing signatures." },
  { n: "02", title: "Invoicing & Payments", desc: "Send invoices with a payment link. Clients pay by card online. Auto-reminders handle the follow-up so you don't have to." },
  { n: "03", title: "Project Status", desc: "Every job tracked from first inquiry to final payment. See exactly where each project stands without keeping it in your head." },
  { n: "04", title: "Client Organizer", desc: "Every client, every quote, every invoice in one searchable place. Nothing falls through the cracks." },
];

const proFeatures = [
  "Quote builder with online client signing",
  "Invoices with online card payments",
  "Automated invoice reminders",
  "Project status tracking",
  "Client organizer with full history",
  "Unlimited quotes, invoices & clients",
];

const websiteFeatures = [
  "Professional design for your trade",
  "Custom domain setup",
  "Mobile-optimized and fast",
  "We handle all edits — just email us",
  "Hosted and maintained for you",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="px-8 pt-20 pb-16 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <h1
            className="text-7xl md:text-8xl text-[#0f0f0f] leading-[1.02] mb-6"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            The admin<br />
            <em className="text-[#15803d] not-italic">you never had.</em>
          </h1>
          <p className="text-lg text-[#6b7280] leading-relaxed mb-9 font-light max-w-lg">
            Quotes, invoices, project tracking, and client info — all in one place.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/sign-up"
              className="bg-[#15803d] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors"
            >
              Try free for 30 days →
            </Link>
            <Link href="#features" className="text-sm text-[#9ca3af] hover:text-[#0f0f0f] transition-colors font-light">
              See what&apos;s included
            </Link>
          </div>
          <p className="mt-5 text-xs text-[#d1d5db] font-light tracking-wide">No contracts · Cancel anytime · Card required after trial</p>
        </div>
      </section>

      <div className="w-full h-px bg-[#e5e7eb]" />

      {/* Pricing */}
      <section id="pricing" className="px-8 py-16 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl text-[#0f0f0f] mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              Simple pricing.
            </h2>
            <p className="text-[#9ca3af] font-light text-sm">First month free. No contracts, cancel anytime.</p>
          </div>
          <Link href="/pricing" className="text-sm text-[#15803d] hover:text-[#14532d] transition-colors font-light hidden md:block">
            Full details →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Pro */}
          <div className="border border-[#bbf7d0] rounded-2xl p-8 bg-[#f0fdf4] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#dcfce7] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs text-[#15803d] uppercase tracking-[0.15em] font-medium mb-1.5">Pro</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-semibold text-[#14532d]" style={{ fontFamily: "var(--font-sans)" }}>$97</span>
                    <span className="text-[#9ca3af] text-sm font-light">/mo</span>
                  </div>
                </div>
                <div className="text-xs bg-[#15803d] text-white px-3 py-1.5 rounded-full font-medium shrink-0">
                  First month free
                </div>
              </div>
              <Link
                href="/sign-up"
                className="w-full block text-center bg-[#15803d] text-white py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors mb-6"
              >
                Start free trial →
              </Link>
              <div className="space-y-3">
                {proFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-[#374151] font-light">
                    <svg className="w-4 h-4 text-[#15803d] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Website add-on */}
          <div className="border border-[#e5e7eb] rounded-2xl p-8 bg-white flex flex-col justify-between">
            <div>
              <div className="text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-1.5">Add-on</div>
              <h3 className="text-3xl text-[#0f0f0f] mb-3 leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Need a website too?
              </h3>
              <p className="text-[#6b7280] font-light text-sm leading-relaxed mb-6">
                We build and host a clean, professional 1-page site for your business. Custom domain, mobile-ready. You tell us what to say — we handle the rest.
              </p>
              <div className="space-y-3 mb-8">
                {websiteFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-[#374151] font-light">
                    <svg className="w-4 h-4 text-[#9ca3af] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/contact"
              className="w-full block text-center border border-[#0f0f0f] text-[#0f0f0f] py-3 rounded-full text-sm font-medium hover:bg-[#0f0f0f] hover:text-white transition-colors"
            >
              Ask about website pricing →
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-[#e5e7eb]" />

      {/* Features */}
      <section id="features" className="px-8 py-16 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <h2
            className="text-4xl text-[#0f0f0f]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Everything in one place.
          </h2>
          <p className="text-[#9ca3af] font-light text-sm hidden md:block max-w-xs text-right leading-relaxed">
            Built for how contractors work — not adapted from a generic CRM.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-[#e5e7eb]">
          {features.map((f) => (
            <div key={f.n} className="bg-white p-8 group hover:bg-[#f0fdf4] transition-colors">
              <div className="text-xs text-[#15803d] font-medium mb-4 tracking-widest">{f.n}</div>
              <h3
                className="text-xl text-[#0f0f0f] mb-2.5"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm text-[#6b7280] leading-relaxed font-light">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#14532d] px-8 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-5xl md:text-6xl text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            The admin you never had —<br />
            <em className="text-[#86efac] not-italic">starting today.</em>
          </h2>
          <p className="text-[#86efac] font-light mb-10 text-base">
            Join contractors who&apos;ve gotten their business organized.
          </p>
          <Link
            href="/sign-up"
            className="inline-block bg-white text-[#14532d] px-10 py-4 rounded-full text-sm font-semibold hover:bg-[#f0fdf4] transition-colors"
          >
            Get started free →
          </Link>
          <p className="text-[#4ade80] text-xs font-light mt-5 opacity-60 tracking-wide">First month free · No contracts · Cancel anytime</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
