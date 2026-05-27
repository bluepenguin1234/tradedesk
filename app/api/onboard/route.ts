import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createSupabaseServerClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const firstName = (form.get('firstName') as string)?.trim();
  const lastName = (form.get('lastName') as string)?.trim();
  const email = (form.get('email') as string)?.trim().toLowerCase();
  const trade = (form.get('trade') as string)?.trim();
  const password = form.get('password') as string;

  if (!firstName || !lastName || !email || !trade || !password) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'password_short' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (authError || !authData.user) {
    console.error('Supabase createUser error:', authError?.message, authError?.status);
    const code = authError?.message?.includes('already registered') ? 'email_taken' : 'auth_error';
    return NextResponse.json({ error: code, detail: authError?.message }, { status: 400 });
  }

  const userId = authData.user.id;
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  let checkoutUrl: string;
  try {
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      metadata: { supabase_id: userId },
    });

    await admin.from('profiles').insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      trade,
      stripe_customer_id: customer.id,
      subscription_status: 'incomplete',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { supabase_id: userId },
      },
      payment_method_collection: 'always',
      success_url: `${origin}/dashboard?welcome=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      metadata: { supabase_id: userId },
    });

    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    checkoutUrl = session.url;
  } catch (err) {
    // Roll back the auth user if Stripe/DB setup fails
    await admin.auth.admin.deleteUser(userId);
    console.error('Onboard error:', err);
    return NextResponse.json({ error: 'auth_error' }, { status: 500 });
  }

  // Send welcome email (non-blocking — don't fail if this errors)
  sendEmail(
    email,
    "You're in. Here's how to get started.",
    `<p>Hi ${firstName},</p>
    <p>Welcome to TradeDesk — your free month starts now. You won't be charged until day 31.</p>
    <p>Here's what to do first:</p>
    <ol>
      <li>Add your first client</li>
      <li>Create a quote</li>
      <li>Connect your Stripe account to accept payments</li>
    </ol>
    <p><a href="${origin}/dashboard">Go to your dashboard →</a></p>
    <p>— The TradeDesk team</p>`
  ).catch(console.error);

  // Sign in so the session cookie is set before redirect — user lands logged in when they return from Stripe
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return NextResponse.json({ error: 'auth_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkout_url: checkoutUrl });
}
