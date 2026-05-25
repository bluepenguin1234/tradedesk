import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Public endpoint — no auth required
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('quotes')
    .select('*, clients(name, email), profiles(first_name, last_name, trade, business_name)')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Don't expose sensitive fields on the public endpoint
  const { user_id: _, ...safe } = data;
  return NextResponse.json({ quote: safe });
}
