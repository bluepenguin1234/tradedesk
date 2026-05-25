import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO:
  // 1. Fetch contractor's stripe_connect_account_id from profiles
  // 2. Create Stripe Payment Link on contractor's connected account
  // 3. Store link in invoices.stripe_payment_link
  // 4. Set status = sent, sent_at = now()
  // 5. Send invoice email to client via Resend with payment link
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
