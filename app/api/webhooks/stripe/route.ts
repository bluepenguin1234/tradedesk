import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

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

      // Notify the contractor
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
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to dashboard →</a></p>`
        );
      }
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Match by payment intent stored on invoice
      if (session.payment_intent) {
        const { data: invoice } = await admin.from('invoices')
          .select('id, project_id, user_id, invoice_number, total')
          .eq('stripe_payment_intent_id', session.payment_intent as string)
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

          // Notify contractor
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
              <p>Invoice ${invoice.invoice_number} for $${(invoice.total / 100).toFixed(2)} has been paid.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoice.id}">View invoice →</a></p>`
            );
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
