import { createBrowserClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (client components)
export function createSupabaseBrowserClient() {
  return createBrowserClient(url, anon);
}

// Server client (server components, route handlers) — reads/writes cookies
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — cookies are read-only there
        }
      },
    },
  });
}

// Admin client (service role — bypasses RLS; server-only)
export function createAdminClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Guarantees a profiles row exists for an authenticated user. clients, quotes,
// invoices and projects all FK to profiles(id), so a missing profile makes
// every create fail with a foreign key violation. Inserts a minimal row if
// absent; leaves an existing profile untouched.
type AuthedUser = {
  id: string;
  user_metadata?: { first_name?: string; last_name?: string; trade?: string };
};

export async function ensureProfile(user: AuthedUser) {
  const admin = createAdminClient();
  const meta = user.user_metadata ?? {};
  await admin.from('profiles').upsert(
    {
      id: user.id,
      first_name: meta.first_name ?? null,
      last_name: meta.last_name ?? null,
      trade: meta.trade ?? null,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
}
