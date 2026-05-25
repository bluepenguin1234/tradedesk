import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: auth check → fetch quotes for user from Supabase → return list
  return NextResponse.json({ quotes: [] });
}

export async function POST(req: NextRequest) {
  // TODO: auth check → validate body → auto-generate quote_number → insert into quotes → return created quote
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
