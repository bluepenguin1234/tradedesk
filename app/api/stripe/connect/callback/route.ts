import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const { data: profile } = await supabase.from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_connect_account_id) {
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
    const onboarded = account.details_submitted && account.charges_enabled;
    await supabase.from('profiles')
      .update({ stripe_connect_onboarded: onboarded })
      .eq('id', user.id);
  }

  return NextResponse.redirect(new URL('/dashboard', req.url));
}
