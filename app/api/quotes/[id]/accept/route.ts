import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

// Public endpoint — no auth required (client is accepting the quote)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const acceptedName = (body.accepted_name as string)?.trim();

  if (!acceptedName) {
    return NextResponse.json({ error: 'Signature name is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: quote } = await admin
    .from('quotes')
    .select('*, profiles(first_name, last_name)')
    .eq('id', id)
    .single();

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quote.status === 'accepted') return NextResponse.json({ ok: true, already_accepted: true });
  if (quote.status !== 'sent') {
    return NextResponse.json({ error: 'Quote cannot be accepted in its current state' }, { status: 400 });
  }

  await admin.from('quotes')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_name: acceptedName })
    .eq('id', id);

  // Auto-advance linked project to in_progress
  if (quote.project_id) {
    await admin.from('projects')
      .update({ status: 'in_progress' })
      .eq('id', quote.project_id);
  }

  // Notify contractor
  const { data: authUser } = await admin.auth.admin.getUserById(quote.user_id);
  if (authUser.user?.email) {
    const contractor = quote.profiles;
    await sendEmail(
      authUser.user.email,
      `${acceptedName} accepted your quote`,
      `<p>Hi ${contractor?.first_name ?? ''},</p>
      <p><strong>${acceptedName}</strong> has accepted quote ${quote.quote_number} for $${quote.total.toFixed(2)}.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/${id}">View quote →</a></p>`
    );
  }

  return NextResponse.json({ ok: true });
}
