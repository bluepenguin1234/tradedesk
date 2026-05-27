'use client';

import { useState, useEffect, useRef } from 'react';

interface Profile {
  logo_url: string | null;
  stripe_connect_onboarded: boolean;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.profile) {
        setProfile(d.profile);
        setLogoUrl(d.profile.logo_url ?? null);
      }
    });
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    const fd = new FormData();
    fd.append('logo', file);
    const res = await fetch('/api/logo', { method: 'POST', body: fd });
    const j = await res.json();
    if (res.ok) {
      setLogoUrl(j.logo_url + '?t=' + Date.now());
      setMessage('Logo updated.');
    } else {
      setMessage(j.error ?? 'Upload failed.');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleRemove() {
    setRemoving(true);
    setMessage('');
    const res = await fetch('/api/logo', { method: 'DELETE' });
    if (res.ok) {
      setLogoUrl(null);
      setMessage('Logo removed.');
    } else {
      setMessage('Failed to remove logo.');
    }
    setRemoving(false);
  }

  const stripeOnboarded = profile?.stripe_connect_onboarded ?? false;

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl sm:text-3xl text-[#0f0f0f] mb-7" style={{ fontFamily: 'var(--font-serif)' }}>
        Settings
      </h1>

      {/* Stripe Connect */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">Payments</p>
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

        {message && <p className="mt-2 text-xs text-[#6b7280]">{message}</p>}
      </div>

      {/* Account */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
        <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-3">Account</p>
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
