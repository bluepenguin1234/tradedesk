import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { ProjectStatus, QuoteStatus, InvoiceStatus } from '@/types';
import { Greeting } from './_components/Greeting';
import { ActionTiles } from './_components/ActionTiles';
import { JobCards } from './_components/JobCards';
import { buildJobCards } from '@/lib/jobs';

interface ProjectRow {
  id: string;
  status: ProjectStatus;
  created_at: string;
  clients: { name: string } | null;
}
interface QuoteRow {
  id: string;
  status: QuoteStatus;
  total: number;
  sent_at: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}
interface InvoiceRow {
  id: string;
  status: InvoiceStatus;
  total: number;
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}
interface ClientRow {
  id: string;
  name: string;
  created_at: string;
}

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, projectsRes, quotesRes, invoicesRes, clientsRes] = await Promise.all([
    supabase.from('profiles').select('first_name, stripe_connect_onboarded').eq('id', user.id).single(),
    supabase.from('projects').select('id, status, created_at, clients(name)').eq('user_id', user.id),
    supabase.from('quotes').select('id, status, total, sent_at, created_at, project_id, clients(name)').eq('user_id', user.id),
    supabase.from('invoices').select('id, status, total, sent_at, paid_at, due_date, created_at, project_id, clients(name)').eq('user_id', user.id),
    supabase.from('clients').select('id, name, created_at').eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const projects = (projectsRes.data ?? []) as unknown as ProjectRow[];
  const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];
  const invoices = (invoicesRes.data ?? []) as unknown as InvoiceRow[];
  const clients = (clientsRes.data ?? []) as ClientRow[];

  const cards = buildJobCards({ projects, quotes, invoices, clients });
  const stripeOnboarded = profile?.stripe_connect_onboarded ?? false;

  return (
    <div className="px-5 pt-6">
      {!stripeOnboarded && (
        <Link
          href="/dashboard/settings"
          className="block bg-[#fefce8] border border-[#fde047] rounded-xl px-4 py-3 mb-6 text-sm text-[#713f12] font-light"
        >
          Connect Stripe in Settings to start collecting payments online.
        </Link>
      )}

      <Greeting firstName={profile?.first_name ?? ''} />
      <ActionTiles />
      <JobCards cards={cards} />
    </div>
  );
}
