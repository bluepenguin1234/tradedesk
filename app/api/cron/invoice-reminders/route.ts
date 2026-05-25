import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // TODO: find invoices where due_date < today and status = sent → set status = overdue, send reminder to client
  // Find invoices due today → send "due today" reminder
  // Find invoices due in 3 days → send "due soon" reminder
  return NextResponse.json({ ok: true });
}
