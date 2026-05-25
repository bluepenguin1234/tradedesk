import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: create Stripe Express account → generate onboarding link → redirect contractor to Stripe
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
