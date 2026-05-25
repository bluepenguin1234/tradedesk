import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { LineItem } from '@/types';

function calcTotals(lineItems: LineItem[], taxRate: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  const total = subtotal * (1 + taxRate / 100);
  return { subtotal, total };
}

async function nextQuoteNumber(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  const n = (count ?? 0) + 1;
  return `QT-${year}-${String(n).padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');
  let query = supabase
    .from('quotes')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotes: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { client_id, project_id, line_items = [], tax_rate = 0, notes, expires_at } = body;

  const { subtotal, total } = calcTotals(line_items, tax_rate);
  const quote_number = await nextQuoteNumber(supabase, user.id);

  const { data, error } = await supabase.from('quotes').insert({
    user_id: user.id,
    client_id: client_id || null,
    project_id: project_id || null,
    quote_number,
    status: 'draft',
    line_items,
    tax_rate,
    subtotal,
    total,
    notes: notes?.trim() || null,
    expires_at: expires_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quote: data }, { status: 201 });
}
