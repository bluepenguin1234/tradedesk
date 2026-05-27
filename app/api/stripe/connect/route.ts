import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  try {
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
      refresh_url: `${origin}/api/stripe/connect`,
      return_url: `${origin}/api/stripe/connect/callback`,
      type: 'account_onboarding',
    });

    return NextResponse.redirect(accountLink.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start Stripe onboarding.';
    console.error('Stripe connect error:', message);
    // Render a friendly error page instead of a generic 500
    return new NextResponse(
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Connect Stripe — TradeDesk</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 80px auto; padding: 0 24px; color: #0f0f0f; }
    h1 { font-family: Georgia, serif; font-size: 28px; margin: 0 0 12px; }
    p { color: #4b5563; line-height: 1.5; }
    .err { background: #fef2f2; border: 1px solid #fecaca; padding: 14px 16px; border-radius: 10px; color: #991b1b; font-size: 14px; margin: 18px 0; word-break: break-word; }
    a.btn { display: inline-block; background: #15803d; color: white; padding: 12px 22px; border-radius: 24px; text-decoration: none; font-weight: 500; margin-top: 8px; }
    a.btn:hover { background: #14532d; }
    .links { margin-top: 18px; font-size: 13px; }
    .links a { color: #6b7280; margin-right: 14px; }
  </style>
</head>
<body>
  <h1>We couldn&apos;t reach Stripe.</h1>
  <p>Stripe rejected the request to start Connect onboarding. The message they returned:</p>
  <div class="err">${escapeHtml(message)}</div>
  <p>This is usually a one-time platform setup step in your Stripe Dashboard. Once it&apos;s resolved, try again.</p>
  <a href="/api/stripe/connect" class="btn">Try again →</a>
  <div class="links">
    <a href="https://dashboard.stripe.com/settings/connect">Stripe Connect settings</a>
    <a href="/dashboard">Back to dashboard</a>
  </div>
</body>
</html>`,
      { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
