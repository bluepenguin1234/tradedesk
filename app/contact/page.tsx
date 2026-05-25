'use client';

import { useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const trades = [
  'Plumber', 'Electrician', 'HVAC', 'Roofer', 'Painter',
  'Landscaper', 'General Contractor', 'Handyman', 'Carpenter', 'Other',
];

const included = [
  'Services & pricing section',
  'Contact info & map',
  'Mobile-optimised design',
  'Hosted & maintained for you',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', trade: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-sans)' }}>
      <Nav />

      <main className="max-w-6xl mx-auto px-6 md:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">

          {/* Left — editorial column */}
          <div
            className="md:sticky md:top-28"
            style={{ animation: 'fadeUp 0.6s ease both' }}
          >
            {/* Eyebrow */}
            <p className="text-xs tracking-[0.2em] uppercase text-[#15803d] font-medium mb-6">
              Website add-on
            </p>

            {/* Headline */}
            <h1
              className="text-5xl md:text-6xl text-[#0f0f0f] leading-[1.05] mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Get a site<br />
              <em className="text-[#15803d] not-italic">that works<br />as hard as you.</em>
            </h1>

            {/* Ruled divider */}
            <div className="w-12 h-px bg-[#15803d] mb-8" />

            <p className="text-[#6b7280] leading-relaxed mb-10 font-light text-[15px]">
              Our team builds a clean, professional 1-page website for your business —
              your services, contact details, and booking link — then hosts and maintains
              it so you never have to touch it.
            </p>

            {/* What's included */}
            <div className="border border-[#e5e7eb] rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f3f4f6]">
                <p className="text-xs tracking-[0.15em] uppercase text-[#9ca3af] font-medium">
                  What's included
                </p>
              </div>
              <ul className="divide-y divide-[#f3f4f6]">
                {included.map((item, i) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 px-6 py-3.5"
                    style={{ animation: `fadeUp 0.5s ease ${0.1 + i * 0.06}s both` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] shrink-0" />
                    <span className="text-sm text-[#374151] font-light">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social proof note */}
            <p className="text-xs text-[#9ca3af] mt-6 font-light leading-relaxed">
              One-time build fee + low monthly hosting. Pricing discussed after we hear about your business.
            </p>
          </div>

          {/* Right — form */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.15s both' }}>
            {status === 'sent' ? (
              <div className="border border-[#e5e7eb] rounded-2xl p-10 text-center">
                {/* Success state */}
                <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mx-auto mb-6">
                  <svg className="w-6 h-6 text-[#15803d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2
                  className="text-2xl text-[#0f0f0f] mb-3"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Got it — we'll be in touch.
                </h2>
                <p className="text-sm text-[#6b7280] font-light leading-relaxed">
                  We'll reach out within 1 business day to talk through your site and pricing.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="border border-[#e5e7eb] rounded-2xl p-8 md:p-10 space-y-6"
              >
                <div>
                  <p
                    className="text-xl text-[#0f0f0f] mb-1"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Tell us about your business
                  </p>
                  <p className="text-sm text-[#9ca3af] font-light">
                    We'll follow up within 1 business day.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="John Smith"
                    required
                    className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db] transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="john@smithplumbing.com"
                    required
                    className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db] transition-colors"
                  />
                </div>

                {/* Trade */}
                <div>
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">
                    Your trade
                  </label>
                  <select
                    value={form.trade}
                    onChange={(e) => set('trade', e.target.value)}
                    required
                    className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] transition-colors"
                  >
                    <option value="" disabled>Select your trade</option>
                    {trades.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">
                    Anything else we should know?
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder="Tell us a bit about your business, where you're based, or what you're looking for…"
                    rows={4}
                    className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db] transition-colors resize-none"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-500">
                    Something went wrong — please try again or email us directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-[#15803d] text-white py-3.5 rounded-full font-medium text-sm hover:bg-[#14532d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending…' : 'Send enquiry →'}
                </button>

                <p className="text-center text-[#9ca3af] text-xs font-light">
                  No spam. We'll only use this to follow up about your website.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
