import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const proFeatures = [
  "Quote builder with online client signing",
  "Invoices with online card payments",
  "Automated invoice reminders",
  "Project status tracking",
  "Client organizer with full history",
  "Unlimited quotes, invoices & clients",
  "Search across all records",
  "Email & chat support",
];

const websiteFeatures = [
  "Professional design for your trade",
  "Custom domain setup and management",
  "Mobile-optimized and fast",
  "We handle all edits — just email us",
  "Hosted and maintained for you",
];

const faqs = [
  {
    q: "What happens after my free month?",
    a: "Your card is charged on day 31 at $29/mo. You'll get a reminder email at day 25 and day 28. Cancel anytime before day 31 and you won't be charged.",
  },
  {
    q: "What's the 0.5% fee?",
    a: "When a client pays an invoice through TradeDesk, we charge a 0.5% platform fee on top of standard card processing. So on a $1,000 invoice you pay $5. Keeps the subscription cheap and aligns our incentives with yours — we make more when you make more.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "Yes — we require a card to start your trial. This keeps the platform running smoothly and means you don't have to re-enter your details when you decide to stay.",
  },
  {
    q: "How does online payment work?",
    a: "When you send an invoice, your client gets a secure payment link. They pay by card, Apple Pay, or Google Pay. Money goes directly to your connected bank account via Stripe.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no cancellation fees. Cancel from your account settings and your subscription stops at the end of the billing period. Your data is preserved for 60 days.",
  },
  {
    q: "What trades does TradeDesk work for?",
    a: "Any trade — plumbers, electricians, HVAC, roofers, painters, landscapers, general contractors, handymen. If you send quotes and invoices, it works for you.",
  },
  {
    q: "What is the website add-on?",
    a: "We build and host a professional 1-page site for your business. You tell us your services and contact info — we handle design, hosting, domain setup, and all future edits. Priced separately from your TradeDesk subscription.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="px-8 pt-20 pb-16 max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-7xl text-[#0f0f0f] leading-[1.02] mb-5" style={{ fontFamily: "var(--font-serif)" }}>
            Simple pricing.
          </h1>
          <p className="text-lg text-[#6b7280] font-light">First month free. No contracts, cancel anytime.</p>
        </div>
      </section>

      <div className="w-full h-px bg-[#e5e7eb]" />

      {/* Pricing Cards */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-5">

          {/* Pro */}
          <div className="border border-[#bbf7d0] rounded-2xl p-8 bg-[#f0fdf4] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#dcfce7] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs text-[#15803d] uppercase tracking-[0.15em] font-medium mb-1.5">Pro</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-semibold text-[#14532d]" style={{ fontFamily: "var(--font-sans)" }}>$29</span>
                    <span className="text-[#9ca3af] text-sm font-light">/mo</span>
                  </div>
                  <div className="text-[#6b7280] text-xs font-light mt-1">+ 0.5% on payments we process for you</div>
                </div>
                <div className="text-xs bg-[#15803d] text-white px-3 py-1.5 rounded-full font-medium shrink-0">
                  First month free
                </div>
              </div>
              <Link href="/sign-up" className="w-full block text-center bg-[#15803d] text-white py-3 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors mb-6">
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

          {/* Website Add-on */}
          <div className="border border-[#e5e7eb] rounded-2xl p-8 bg-white flex flex-col">
            <div className="flex-1">
              <div className="text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-1.5">Add-on Service</div>
              <h2 className="text-3xl text-[#0f0f0f] mb-3 leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Contractor website.
              </h2>
              <p className="text-[#6b7280] font-light text-sm leading-relaxed mb-6">
                A clean, professional 1-page site built and maintained by us. Custom domain, mobile-ready. You tell us what to say — we handle everything else.
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
            <Link href="/contact" className="w-full block text-center border border-[#0f0f0f] text-[#0f0f0f] py-3 rounded-full text-sm font-medium hover:bg-[#0f0f0f] hover:text-white transition-colors">
              Ask about website pricing →
            </Link>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-[#e5e7eb]" />

      {/* FAQ */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-4xl text-[#0f0f0f] mb-10" style={{ fontFamily: "var(--font-serif)" }}>
          Common questions.
        </h2>
        <div className="grid md:grid-cols-2 gap-px bg-[#e5e7eb]">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white p-8">
              <h3 className="text-[#0f0f0f] font-medium mb-3 text-base" style={{ fontFamily: "var(--font-serif)" }}>{faq.q}</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed font-light">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#14532d] px-8 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-5xl text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            The admin you never had —<br />
            <em className="text-[#86efac] not-italic">starting today.</em>
          </h2>
          <p className="text-[#86efac] font-light mb-10">First month free. No contracts. Cancel anytime.</p>
          <Link href="/sign-up" className="inline-block bg-white text-[#14532d] px-10 py-4 rounded-full text-sm font-semibold hover:bg-[#f0fdf4] transition-colors">
            Get started free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
