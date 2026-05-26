'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';

const trades = [
  'Plumber', 'Electrician', 'HVAC', 'Roofer', 'Painter',
  'Landscaper', 'General Contractor', 'Handyman', 'Carpenter', 'Other',
];

const errorMessages: Record<string, string> = {
  missing_fields: 'Please fill in all fields.',
  password_short: 'Password must be at least 8 characters.',
  email_taken: 'An account with that email already exists.',
  auth_error: 'Something went wrong creating your account. Please try again.',
};

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(errorMessages[json.error] ?? 'Something went wrong. Please try again.');
        return;
      }

      // Send them to Stripe to add a card (free for 30 days, charged on day 31).
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Left — copy */}
          <div className="pt-4">
            <h1 className="text-5xl md:text-6xl text-[#0f0f0f] leading-[1.05] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Start your<br />
              <em className="text-[#15803d] not-italic">free month.</em>
            </h1>
            <p className="text-[#6b7280] font-light leading-relaxed mb-8">
              Full access for 30 days. No charge until day 31. Cancel anytime before then.
            </p>
            <div className="space-y-4">
              {[
                'Unlimited quotes and invoices',
                'Client organizer and pipeline',
                'Project status tracking',
                'Online invoice payments via Stripe',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-[#374151] font-light">
                  <svg className="w-4 h-4 text-[#15803d] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="border border-[#e5e7eb] rounded-2xl p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    required
                    className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Smith"
                    required
                    className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@smithplumbing.com"
                  required
                  className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">Your trade</label>
                <select
                  name="trade"
                  required
                  defaultValue=""
                  className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d]"
                >
                  <option value="" disabled>Select your trade</option>
                  {trades.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  required
                  className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#15803d] text-white py-3.5 rounded-full font-medium text-sm hover:bg-[#14532d] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating your account…' : 'Start free trial →'}
              </button>
            </form>

            <p className="text-center text-[#9ca3af] text-xs mt-6 font-light">
              Already have an account?{' '}
              <Link href="/login" className="text-[#15803d] hover:underline">Log in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
