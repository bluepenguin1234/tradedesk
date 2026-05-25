import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: PUBLIC — no auth required
  // Validate accepted_name not empty
  // Set status = accepted, accepted_at = now(), accepted_name
  // If linked project: set project status = in_progress
  // Send "quote accepted" notification to contractor via Resend
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
