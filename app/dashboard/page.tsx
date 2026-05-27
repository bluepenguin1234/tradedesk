import { createSupabaseServerClient } from '@/lib/supabase';

const quickActions = [
  { label: "New Quote", href: "/dashboard/quotes/new" },
  { label: "New Invoice", href: "/dashboard/invoices/new" },
  { label: "Add Client", href: "/dashboard/clients/new" },
  { label: "New Project", href: "/dashboard/projects/new" },
];

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let stripeOnboarded = true;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_onboarded')
      .eq('id', user.id)
      .single();
    stripeOnboarded = profile?.stripe_connect_onboarded ?? false;
  }

  return (
    <div className="px-8 py-10 max-w-5xl">
      <h1 className="text-3xl text-[#0f0f0f] mb-1" style={{ fontFamily: "var(--font-serif)" }}>
        Overview
      </h1>
      <p className="text-[#9ca3af] text-sm font-light mb-10">Here&apos;s where everything stands.</p>

      {!stripeOnboarded && (
        <div className="bg-[#fefce8] border border-[#fde047] rounded-xl px-5 py-4 flex items-center justify-between mb-8">
          <p className="text-sm text-[#713f12] font-light">Connect Stripe to start collecting invoice payments online.</p>
          <a href="/api/stripe/connect" className="text-sm text-[#713f12] font-medium underline shrink-0 ml-4">
            Connect Stripe →
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {quickActions.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="border border-[#e5e7eb] bg-white rounded-xl px-4 py-5 text-sm font-medium text-[#0f0f0f] hover:border-[#15803d] hover:bg-[#f0fdf4] transition-colors text-center"
          >
            {a.label}
          </a>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {[
          { label: "Outstanding invoices", value: "—" },
          { label: "Quotes awaiting response", value: "—" },
          { label: "Active projects", value: "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#e5e7eb] rounded-xl p-6">
            <div className="text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">{s.label}</div>
            <div className="text-3xl font-semibold text-[#0f0f0f]" style={{ fontFamily: "var(--font-sans)" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
