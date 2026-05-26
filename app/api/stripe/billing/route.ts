import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient, createAdminClient } from '@/lib/supabase';

// Resumes Stripe Checkout for a contractor who abandoned the card step during
// sign-up. The trial end is pinned to their original trial_ends_at so coming
// back later doesn't grant a fresh 30 days.
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, trial_ends_at')
    .eq('id', user.id)
    .single();

  // No customer, or a subscription already exists (card on file) — nothing to do.
  if (!profile?.stripe_customer_id || profile.stripe_subscription_id) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const trialEndUnix = profile.trial_ends_at
    ? Math.floor(new Date(profile.trial_ends_at).getTime() / 1000)
    : 0;
  const nowUnix = Math.floor(Date.now() / 1000);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: profile.stripe_customer_id,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    // Keep the original trial if it's still in the future; otherwise charge now.
    subscription_data: trialEndUnix > nowUnix + 60 ? { trial_end: trialEndUnix } : undefined,
    payment_method_collection: 'always',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=incomplete`,
  });

  if (!session.url) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.redirect(session.url);
}
