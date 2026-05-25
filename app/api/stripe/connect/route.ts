import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  // Check if account already exists
  const { data: profile } = await supabase.from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single();

  let accountId = profile?.stripe_connect_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { supabase_id: user.id },
    });
    accountId = account.id;
    await supabase.from('profiles')
      .update({ stripe_connect_account_id: accountId })
      .eq('id', user.id);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback`,
    type: 'account_onboarding',
  });

  return NextResponse.redirect(accountLink.url);
}
