import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: fetch client + all linked quotes, invoices, projects
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
