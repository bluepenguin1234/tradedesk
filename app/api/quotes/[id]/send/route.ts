import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: set status = sent, sent_at = now()
  // Send email to client via Resend with quote acceptance link (/quotes/[id])
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
