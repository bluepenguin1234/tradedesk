'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Profile {
  logo_url: string | null;
  stripe_connect_onboarded: boolean;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
}

const oneDay = 24 * 60 * 60 * 1000;

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / oneDay));
}

function subStatusLabel(status: string | null, trialEndsAt: string | null): { text: string; color: string } {
  switch (status) {
    case 'trialing':
      return {
        text: trialEndsAt ? `Trial · ${daysUntil(trialEndsAt)} days left` : 'Trial',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'active':
      return { text: 'Active', color: 'bg-[#f0fdf4] text-[#15803d] border-[#d1fae5]' };
    case 'past_due':
      return { text: 'Payment overdue', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'cancelled':
      return { text: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200' };
    case 'incomplete':
      return { text: 'Setup not finished', color: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]' };
    default:
      return { text: status ?? 'Unknown', color: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]' };
  }
}

export default function Settings() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [logoMsg, setLogoMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [portalBusy, setPortalBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.profile) {
        setProfile(d.profile);
        setLogoUrl(d.profile.logo_url ?? null);
      }
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [supabase]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLogoMsg('');
    const fd = new FormData();
    fd.append('logo', file);
    const res = await fetch('/api/logo', { method: 'POST', body: fd });
    const j = await res.json();
    if (res.ok) {
      setLogoUrl(j.logo_url + '?t=' + Date.now());
      setLogoMsg('Logo updated.');
    } else {
      setLogoMsg(j.error ?? 'Upload failed.');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleRemove() {
    setRemoving(true);
    setLogoMsg('');
    const res = await fetch('/api/logo', { method: 'DELETE' });
    if (res.ok) {
      setLogoUrl(null);
      setLogoMsg('Logo removed.');
    } else {
      setLogoMsg('Failed to remove logo.');
    }
    setRemoving(false);
  }

  async function handleManageSubscription() {
    setPortalBusy(true);
    const res = await fetch('/api/subscription/portal', { method: 'POST' });
    setPortalBusy(false);
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      const { error } = await res.json().catch(() => ({}));
      alert(error ?? 'Could not open billing portal.');
    }
  }

  async function handleCompleteSignup() {
    setCheckoutBusy(true);
    const res = await fetch('/api/subscription/checkout', { method: 'POST' });
    setCheckoutBusy(false);
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      const { error } = await res.json().catch(() => ({}));
      alert(error ?? 'Could not start checkout.');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters.');
      return;
    }
    setPasswordBusy(true);
    setPasswordMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg('Password updated.');
      setNewPassword('');
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailMsg('Enter a valid email address.');
      return;
    }
    setEmailBusy(true);
    setEmailMsg('');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailBusy(false);
    if (error) {
      setEmailMsg(error.message);
    } else {
      setEmailMsg(`Confirmation link sent to ${newEmail.trim()}. Click it to finish the change.`);
      setNewEmail('');
    }
  }

  const stripeOnboarded = profile?.stripe_connect_onboarded ?? false;
  const sub = subStatusLabel(profile?.subscription_status ?? null, profile?.trial_ends_at ?? null);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl sm:text-3xl text-[#0f0f0f] mb-7" style={{ fontFamily: 'var(--font-serif)' }}>
        Settings
      </h1>

      {/* Subscription */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">Subscription</p>
            <p className="text-sm text-[#0f0f0f] font-medium">TradeDesk Pro · $97/mo</p>
            <p className={`inline-block mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${sub.color}`}>
              {sub.text}
            </p>
          </div>
          {profile?.stripe_subscription_id ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalBusy}
              className="shrink-0 border border-[#e5e7eb] text-[#0f0f0f] px-4 py-2 rounded-full text-xs font-medium hover:border-[#0f0f0f] transition-colors disabled:opacity-50"
            >
              {portalBusy ? 'Opening…' : 'Manage →'}
            </button>
          ) : (
            <button
              onClick={handleCompleteSignup}
              disabled={checkoutBusy}
              className="shrink-0 bg-[#15803d] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50"
            >
              {checkoutBusy ? 'Opening…' : 'Complete signup →'}
            </button>
          )}
        </div>
        <p className="text-[11px] text-[#9ca3af] mt-3 font-light">
          {profile?.stripe_subscription_id
            ? "Cancel, change payment method, or download invoices via Stripe's billing portal."
            : 'You need to add a payment method to start your 30-day free trial. No charge until day 31.'}
        </p>
      </div>

      {/* Stripe Connect (invoice payments) */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">Invoice payments</p>
            <p className="text-sm text-[#0f0f0f] font-medium">Stripe</p>
            <p className="text-[12px] text-[#6b7280] mt-0.5">
              {stripeOnboarded
                ? 'Connected — invoice payments go straight to your bank.'
                : 'Not connected — invoices can\'t be sent until you connect.'}
            </p>
          </div>
          {stripeOnboarded ? (
            <span className="shrink-0 text-[11px] text-[#15803d] bg-[#f0fdf4] border border-[#d1fae5] px-2.5 py-1 rounded-full font-medium">
              Connected
            </span>
          ) : (
            <a
              href="/api/stripe/connect"
              className="shrink-0 bg-[#15803d] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#14532d] transition-colors"
            >
              Connect →
            </a>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4">
        <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">Business logo</p>
        <p className="text-[12px] text-[#6b7280] mb-3">Appears on your quotes and invoices.</p>

        {logoUrl ? (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Your logo" className="h-16 object-contain border border-[#e5e7eb] rounded-lg p-2 bg-white" />
          </div>
        ) : (
          <div className="mb-3 h-16 w-32 border border-dashed border-[#d1d5db] rounded-lg flex items-center justify-center text-xs text-[#9ca3af]">
            No logo yet
          </div>
        )}

        <div className="flex gap-3 items-center flex-wrap">
          <label className="cursor-pointer bg-[#15803d] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#14532d] transition-colors">
            {uploading ? 'Uploading…' : logoUrl ? 'Replace' : 'Upload'}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          {logoUrl && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {removing ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>

        {logoMsg && <p className="mt-2 text-xs text-[#6b7280]">{logoMsg}</p>}
      </div>

      {/* Account: email + password */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4">
        <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-3">Account</p>

        {/* Current email */}
        <p className="text-[11px] text-[#9ca3af] mb-1">Current email</p>
        <p className="text-sm text-[#0f0f0f] mb-4">{userEmail || '—'}</p>

        {/* Change email */}
        <form onSubmit={handleChangeEmail} className="mb-5">
          <label className="block text-[11px] text-[#9ca3af] mb-1">Change email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]"
            />
            <button
              type="submit"
              disabled={emailBusy || !newEmail.trim()}
              className="shrink-0 bg-[#15803d] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50"
            >
              {emailBusy ? 'Saving…' : 'Update'}
            </button>
          </div>
          {emailMsg && <p className="mt-2 text-xs text-[#6b7280]">{emailMsg}</p>}
        </form>

        {/* Change password */}
        <form onSubmit={handleChangePassword} className="mb-5">
          <label className="block text-[11px] text-[#9ca3af] mb-1">Change password</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="flex-1 border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#0f0f0f] focus:outline-none focus:border-[#15803d]"
            />
            <button
              type="submit"
              disabled={passwordBusy || newPassword.length < 8}
              className="shrink-0 bg-[#15803d] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#14532d] transition-colors disabled:opacity-50"
            >
              {passwordBusy ? 'Saving…' : 'Update'}
            </button>
          </div>
          {passwordMsg && <p className="mt-2 text-xs text-[#6b7280]">{passwordMsg}</p>}
        </form>

        {/* Log out */}
        <a
          href="/api/auth/logout"
          className="block text-center w-full border border-[#e5e7eb] text-[#0f0f0f] py-2.5 rounded-full text-sm font-medium hover:bg-[#fef2f2] hover:border-red-300 hover:text-red-600 transition-colors"
        >
          Log out
        </a>
      </div>
    </div>
  );
}
