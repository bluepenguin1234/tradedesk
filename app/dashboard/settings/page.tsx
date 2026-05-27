'use client';

import { useState, useEffect, useRef } from 'react';

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.profile?.logo_url) setLogoUrl(d.profile.logo_url);
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

  return (
    <div className="px-8 py-10 max-w-2xl">
      <h1 className="text-3xl text-[#0f0f0f] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Settings</h1>

      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 space-y-5">
        <div>
          <p className="text-xs text-[#9ca3af] uppercase tracking-widest font-medium mb-1">Business logo</p>
          <p className="text-sm text-[#6b7280] mb-4">Appears on your quotes and invoices.</p>

          {logoUrl ? (
            <div className="mb-4">
              <img src={logoUrl} alt="Your logo" className="h-20 object-contain border border-[#e5e7eb] rounded-lg p-2" />
            </div>
          ) : (
            <div className="mb-4 h-20 w-40 border border-dashed border-[#d1d5db] rounded-lg flex items-center justify-center text-sm text-[#9ca3af]">
              No logo yet
            </div>
          )}

          <div className="flex gap-3 items-center flex-wrap">
            <label className="cursor-pointer bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
              {uploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {logoUrl && (
              <button onClick={handleRemove} disabled={removing} className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                {removing ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>

          {message && <p className="mt-3 text-sm text-[#6b7280]">{message}</p>}
        </div>
      </div>
    </div>
  );
}
