import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: supabase.auth.signInWithPassword({ email, password }) → set session cookie → redirect to dashboard
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
