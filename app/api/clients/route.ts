import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: auth check → fetch clients for user, support ?search= query param → return list
  return NextResponse.json({ clients: [] });
}

export async function POST(req: NextRequest) {
  // TODO: auth check → validate name required → insert into clients
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
