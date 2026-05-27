import { createSupabaseServerClient } from '@/lib/supabase';
import type { ProjectStatus, QuoteStatus, InvoiceStatus } from '@/types';
import { Greeting } from './_components/Greeting';
import { ActionTiles } from './_components/ActionTiles';
import { Pipeline, type PipelineProject } from './_components/Pipeline';
import { Coach } from './_components/Coach';
import { buildSuggestions } from '@/lib/coach';

interface ProjectRow {
  id: string;
  name: string;
  status: ProjectStatus;
  clients: { name: string } | null;
}
interface QuoteRow {
  id: string;
  quote_number: string | null;
  status: QuoteStatus;
  total: number;
  sent_at: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}
interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  status: InvoiceStatus;
  total: number;
  due_date: string | null;
  sent_at: string | null;
  created_at: string;
  project_id: string | null;
  clients: { name: string } | null;
}

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, projectsRes, quotesRes, invoicesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, stripe_connect_onboarded')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, status, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('quotes')
      .select('id, quote_number, status, total, sent_at, created_at, project_id, clients(name)')
      .eq('user_id', user.id),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, due_date, sent_at, created_at, project_id, clients(name)')
      .eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const projects = (projectsRes.data ?? []) as unknown as ProjectRow[];
  const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];
  const invoices = (invoicesRes.data ?? []) as unknown as InvoiceRow[];

  const latestInvoiceByProject = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.project_id && !latestInvoiceByProject.has(inv.project_id)) {
      latestInvoiceByProject.set(inv.project_id, inv.total);
    }
  }
  const latestQuoteByProject = new Map<string, number>();
  for (const q of quotes) {
    if (q.project_id && !latestQuoteByProject.has(q.project_id)) {
      latestQuoteByProject.set(q.project_id, q.total);
    }
  }

  const pipelineProjects: PipelineProject[] = projects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    clients: p.clients,
    amount:
      p.status === 'invoiced' || p.status === 'paid'
        ? latestInvoiceByProject.get(p.id) ?? null
        : latestQuoteByProject.get(p.id) ?? null,
  }));

  const suggestions = buildSuggestions({
    invoices: invoices.map(i => ({
      id: i.id,
      invoice_number: i.invoice_number,
      status: i.status,
      total: i.total,
      due_date: i.due_date,
      sent_at: i.sent_at,
      created_at: i.created_at,
      clients: i.clients,
    })),
    quotes: quotes.map(q => ({
      id: q.id,
      quote_number: q.quote_number,
      status: q.status,
      sent_at: q.sent_at,
      created_at: q.created_at,
      clients: q.clients,
    })),
    projects: projects.map(p => ({ id: p.id, status: p.status })),
  });

  const stripeOnboarded = profile?.stripe_connect_onboarded ?? false;

  return (
    <div className="px-8 py-10 max-w-5xl">
      {!stripeOnboarded && (
        <div className="bg-[#fefce8] border border-[#fde047] rounded-xl px-5 py-4 flex items-center justify-between mb-8">
          <p className="text-sm text-[#713f12] font-light">
            Connect Stripe to start collecting invoice payments online.
          </p>
          <a
            href="/api/stripe/connect"
            className="text-sm text-[#713f12] font-medium underline shrink-0 ml-4"
          >
            Connect Stripe →
          </a>
        </div>
      )}

      <Greeting firstName={profile?.first_name ?? ''} />
      <ActionTiles />
      <Pipeline projects={pipelineProjects} />
      <Coach suggestions={suggestions} />
    </div>
  );
}
