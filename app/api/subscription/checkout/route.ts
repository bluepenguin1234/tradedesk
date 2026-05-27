import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase';

// Creates a Stripe Checkout Session for the $29/mo TradeDesk Pro plan with
// 30-day trial. Used when an existing user needs to complete (or restart)
// signup — e.g. they were backfilled with no subscription, or their previous
// Checkout session expired.
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  try {
    // Create a Stripe customer if this user doesn't already have one
    // (e.g., the profile was inserted manually outside the onboard flow).
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : undefined,
        metadata: { supabase_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { supabase_id: user.id },
      },
      payment_method_collection: 'always',
      success_url: `${origin}/dashboard?welcome=1`,
      cancel_url: `${origin}/dashboard/settings`,
      metadata: { supabase_id: user.id },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start checkout.';
    console.error('Subscription checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
