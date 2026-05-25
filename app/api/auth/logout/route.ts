import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: supabase.auth.signOut() → clear session cookie → redirect to /
  return NextResponse.redirect(new URL('/', req.url));
}
