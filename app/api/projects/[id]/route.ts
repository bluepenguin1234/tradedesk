import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: update project fields including status
  // If status changes: log to activity history
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
