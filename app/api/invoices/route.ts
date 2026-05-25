import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: auth check → fetch invoices for user → return list
  return NextResponse.json({ invoices: [] });
}

export async function POST(req: NextRequest) {
  // TODO: auth check → validate body → auto-generate invoice_number → insert into invoices
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
