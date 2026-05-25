import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: auth check → fetch projects for user, support ?status= filter → return list
  return NextResponse.json({ projects: [] });
}

export async function POST(req: NextRequest) {
  // TODO: auth check → validate name required → insert into projects
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
