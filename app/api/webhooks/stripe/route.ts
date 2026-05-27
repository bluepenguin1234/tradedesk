import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';
import Stripe from 'stripe';

// We register TWO Stripe webhook endpoints both pointing here:
//   - a platform endpoint for events on the TradeDesk Stripe account (signups, subscription state)
//   - a Connect endpoint for events on contractors' connected accounts (invoice payments)
// Each has its own signing secret. We try both before rejecting.
function verifyEvent(body: string, sig: string): Stripe.Event | null {
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  ].filter((s): s is string => Boolean(s));

  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, sig, secret);
    } catch {
      // try the next secret
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const event = verifyEvent(body, sig);
  if (!event) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  const admin = createAdminClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL || '';

  switch (event.type) {
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === 'trialing' ? 'trialing'
        : sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due'
        : 'cancelled';
      await admin.from('profiles')
        .update({ subscription_status: status, stripe_subscription_id: sub.id })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', sub.customer as string);
      break;
    }

    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice;
      if ((inv as Stripe.Invoice & { subscription?: string }).subscription) {
        await admin.from('profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', inv.customer as string);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      await admin.from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', inv.customer as string);

      const { data: profile } = await admin.from('profiles')
        .select('first_name')
        .eq('stripe_customer_id', inv.customer as string)
        .single();
      if (inv.customer_email) {
        await sendEmail(
          inv.customer_email,
          'Your TradeDesk payment failed',
          `<p>Hi ${profile?.first_name ?? ''},</p>
          <p>We couldn't process your TradeDesk subscription payment. Please update your payment method to keep your account active.</p>
          <p><a href="${origin}/dashboard">Go to dashboard →</a></p>`
        );
      }
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // 1) Signup subscription completion (TradeDesk's $29/mo on platform account)
      if (session.mode === 'subscription' && session.subscription && session.customer) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
        const status = sub.status === 'trialing' ? 'trialing'
          : sub.status === 'active' ? 'active'
          : 'incomplete';
        await admin.from('profiles')
          .update({
            stripe_subscription_id: sub.id,
            subscription_status: status,
            trial_ends_at: trialEndsAt,
          })
          .eq('stripe_customer_id', session.customer as string);
        break;
      }

      // 2) Invoice payment completion on a connected account — match by Payment Link ID.
      //    Stripe sends `payment_link` on the session when the session was spawned by a Payment Link.
      const linkId = typeof session.payment_link === 'string'
        ? session.payment_link
        : session.payment_link?.id ?? null;

      if (linkId) {
        const { data: invoice } = await admin.from('invoices')
          .select('id, project_id, user_id, invoice_number, total')
          .eq('stripe_payment_link_id', linkId)
          .single();

        if (invoice) {
          await admin.from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', invoice.id);

          if (invoice.project_id) {
            await admin.from('projects')
              .update({ status: 'paid' })
              .eq('id', invoice.project_id);
          }

          // Notify the contractor — invoice.total is stored in dollars, not cents.
          const { data: profile } = await admin.from('profiles')
            .select('first_name, last_name')
            .eq('id', invoice.user_id)
            .single();
          const { data: auth } = await admin.auth.admin.getUserById(invoice.user_id);
          if (auth.user?.email) {
            await sendEmail(
              auth.user.email,
              `Invoice ${invoice.invoice_number} has been paid`,
              `<p>Hi ${profile?.first_name ?? ''},</p>
              <p>Invoice ${invoice.invoice_number} for $${invoice.total.toFixed(2)} has been paid.</p>
              <p><a href="${origin}/dashboard/invoices/${invoice.id}">View invoice →</a></p>`
            );
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
