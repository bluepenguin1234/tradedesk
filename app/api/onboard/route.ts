import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: validate fields → create Supabase user → create Stripe customer
  // → start 30-day trial subscription → insert profile → send welcome email → redirect to dashboard
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
