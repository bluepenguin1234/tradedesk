import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/resend';
import { LineItem } from '@/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email), profiles(first_name, last_name, stripe_connect_account_id, stripe_connect_onboarded)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!invoice.clients?.email) {
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });
  }

  const profile = invoice.profiles;
  if (!profile?.stripe_connect_onboarded || !profile?.stripe_connect_account_id) {
    return NextResponse.json(
      { error: 'Connect your Stripe account before sending invoices.', code: 'connect_required' },
      { status: 400 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  // Build Stripe line items (amounts in cents)
  const stripeLineItems = (invoice.line_items as LineItem[]).map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.description },
      unit_amount: Math.round(item.unit_price * 100),
    },
    quantity: item.qty,
  }));

  // 1. Create Payment Link on the contractor's connected account.
  let paymentLink: { id: string; url: string };
  try {
    paymentLink = await stripe.paymentLinks.create(
      {
        line_items: stripeLineItems,
        metadata: { invoice_id: id },
        after_completion: { type: 'redirect', redirect: { url: `${origin}/invoice-paid` } },
      },
      { stripeAccount: profile.stripe_connect_account_id }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe rejected the payment link.';
    console.error('Invoice payment link failed:', message);
    return NextResponse.json({ error: `Stripe: ${message}`, code: 'stripe_failed' }, { status: 500 });
  }

  // 2. Send the email. If it fails, we leave the invoice as draft (no status flip, no link saved).
  //    The Payment Link is harmless if unused; user can retry which makes a new one.
  const contractorName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();
  const dueText = invoice.due_date ? ` due ${new Date(invoice.due_date).toLocaleDateString()}` : '';

  try {
    await sendEmail(
      invoice.clients.email,
      `Invoice from ${contractorName} — $${invoice.total.toFixed(2)}${dueText}`,
      `<p>Hi ${invoice.clients.name},</p>
      <p>${contractorName} has sent you an invoice for $${invoice.total.toFixed(2)}${dueText}.</p>
      <p><a href="${paymentLink.url}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Pay Now →</a></p>
      <p style="color:#6b7280;font-size:12px;">You can pay securely by card, Apple Pay, or Google Pay.</p>`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send the email.';
    console.error('Invoice email send failed:', message);
    return NextResponse.json({ error: `Email failed: ${message}`, code: 'email_failed' }, { status: 500 });
  }

  // 3. Now persist the new state. We store BOTH the link URL (for surfacing
  //    in the UI) and the link ID (so the webhook can match `session.payment_link`
  //    back to this invoice when the client pays).
  const { error: updateError } = await supabase.from('invoices')
    .update({
      stripe_payment_link: paymentLink.url,
      stripe_payment_link_id: paymentLink.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, payment_link: paymentLink.url });
}
