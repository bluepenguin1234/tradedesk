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
    const code = authError?.message?.includes('already registered') ? 'email_taken' : 'auth_error';
    return NextResponse.json({ error: code }, { status: 400 });
  }

  const userId = authData.user.id;

  try {
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      metadata: { supabase_id: userId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID! }],
      trial_period_days: 30,
    });

    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await admin.from('profiles').insert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      trade,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt,
    });
  } catch (err) {
    // Clean up the auth user if Stripe/DB fails
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
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to your dashboard →</a></p>
    <p>— The TradeDesk team</p>`
  ).catch(console.error);

  // Sign in to set session cookies
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return NextResponse.json({ error: 'auth_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
