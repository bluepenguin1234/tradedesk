import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email), profiles(first_name, last_name, logo_url)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    return NextResponse.json({ error: 'Only sent or overdue invoices can be reminded.' }, { status: 400 });
  }
  if (!invoice.clients?.email) {
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });
  }
  if (!invoice.stripe_payment_link) {
    return NextResponse.json({ error: 'No payment link on this invoice. Re-send it to generate one.' }, { status: 400 });
  }

  const contractor = invoice.profiles;
  const contractorName = `${contractor?.first_name ?? ''} ${contractor?.last_name ?? ''}`.trim();
  const logoUrl = contractor?.logo_url ?? null;
  const dueText = invoice.due_date
    ? ` This was due ${new Date(invoice.due_date).toLocaleDateString()}.`
    : '';

  try {
    await sendEmail(
      invoice.clients.email,
      `Reminder: invoice from ${contractorName} — $${invoice.total.toFixed(2)}`,
      `${logoUrl ? `<p><img src="${logoUrl}" alt="${contractorName}" style="max-height:60px;max-width:200px;object-fit:contain" /></p>` : ''}
      <p>Hi ${invoice.clients.name},</p>
      <p>Just a friendly reminder about the invoice from ${contractorName} for $${invoice.total.toFixed(2)}.${dueText}</p>
      <p><a href="${invoice.stripe_payment_link}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Pay Now →</a></p>
      <p style="color:#6b7280;font-size:12px;">You can pay securely by card, Apple Pay, or Google Pay.</p>`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send the reminder.';
    console.error('Invoice reminder failed:', message);
    return NextResponse.json({ error: `Email failed: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
