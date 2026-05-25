import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: fetch quote by id, confirm user owns it
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: update quote fields
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: delete quote (only if status = draft)
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
