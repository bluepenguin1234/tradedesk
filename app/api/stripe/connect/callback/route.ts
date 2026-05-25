import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Stripe redirects here after Connect onboarding
  // Save stripe_connect_account_id to profiles, set stripe_connect_onboarded = true
  return NextResponse.redirect(new URL('/dashboard', req.url));
}
