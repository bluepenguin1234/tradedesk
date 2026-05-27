import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(name, email), profiles(first_name, last_name, logo_url)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quote.status !== 'sent') {
    return NextResponse.json({ error: 'Only sent quotes can be reminded.' }, { status: 400 });
  }
  if (!quote.clients?.email) {
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });
  }

  const contractor = quote.profiles;
  const contractorName = `${contractor?.first_name ?? ''} ${contractor?.last_name ?? ''}`.trim();
  const logoUrl = contractor?.logo_url ?? null;
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const quoteUrl = `${origin}/quotes/${id}`;

  try {
    await sendEmail(
      quote.clients.email,
      `Reminder: quote from ${contractorName} — $${quote.total.toFixed(2)}`,
      `${logoUrl ? `<p><img src="${logoUrl}" alt="${contractorName}" style="max-height:60px;max-width:200px;object-fit:contain" /></p>` : ''}
      <p>Hi ${quote.clients.name},</p>
      <p>Just a friendly reminder — ${contractorName} sent you a quote for $${quote.total.toFixed(2)} and we haven't heard back yet.</p>
      <p><a href="${quoteUrl}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Review Quote →</a></p>
      ${quote.expires_at ? `<p>This quote expires on ${new Date(quote.expires_at).toLocaleDateString()}.</p>` : ''}
      <p style="color:#6b7280;font-size:12px;">If you have any questions, reply to this email.</p>`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send the reminder.';
    console.error('Quote reminder failed:', message);
    return NextResponse.json({ error: `Email failed: ${message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
