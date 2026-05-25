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
    .select('*, clients(name, email), profiles(first_name, last_name, trade)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!quote.clients?.email) return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });

  const { error } = await supabase.from('quotes')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contractor = quote.profiles;
  const contractorName = `${contractor?.first_name ?? ''} ${contractor?.last_name ?? ''}`.trim();
  const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${id}`;

  await sendEmail(
    quote.clients.email,
    `Quote from ${contractorName} — $${quote.total.toFixed(2)}`,
    `<p>Hi ${quote.clients.name},</p>
    <p>${contractorName} has sent you a quote for $${quote.total.toFixed(2)}.</p>
    <p><a href="${quoteUrl}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Review Quote →</a></p>
    ${quote.expires_at ? `<p>This quote expires on ${new Date(quote.expires_at).toLocaleDateString()}.</p>` : ''}
    <p style="color:#6b7280;font-size:12px;">If you have any questions, reply to this email.</p>`
  );

  return NextResponse.json({ ok: true });
}
