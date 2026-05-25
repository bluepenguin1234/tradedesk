import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // TODO: query profiles where trial_ends_at is 7, 5, 2, or 0 days away
  // Send appropriate Resend email for each milestone
  return NextResponse.json({ ok: true });
}
