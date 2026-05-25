import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: verify Stripe webhook signature → handle events:
  // customer.subscription.updated → update profiles.subscription_status
  // customer.subscription.deleted → set subscription_status = 'cancelled'
  // invoice.payment_succeeded (subscription) → set subscription_status = 'active'
  // invoice.payment_failed → set subscription_status = 'past_due', send email
  // checkout.session.completed (invoice payment) → mark invoice paid, update project status
  return NextResponse.json({ received: true });
}
