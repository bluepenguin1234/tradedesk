import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { LineItem } from '@/types';

function calcTotals(lineItems: LineItem[], taxRate: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  const total = subtotal * (1 + taxRate / 100);
  return { subtotal, total };
}

async function nextInvoiceNumber(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  const n = (count ?? 0) + 1;
  return `INV-${year}-${String(n).padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');
  let query = supabase
    .from('invoices')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { client_id, project_id, quote_id, line_items = [], tax_rate = 0, due_date, notes } = body;

  const { subtotal, total } = calcTotals(line_items, tax_rate);
  const invoice_number = await nextInvoiceNumber(supabase, user.id);

  const { data, error } = await supabase.from('invoices').insert({
    user_id: user.id,
    client_id: client_id || null,
    project_id: project_id || null,
    quote_id: quote_id || null,
    invoice_number,
    status: 'draft',
    line_items,
    tax_rate,
    subtotal,
    total,
    due_date: due_date || null,
    notes: notes?.trim() || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If created from an accepted quote, mark quote as invoiced
  if (quote_id) {
    await supabase.from('quotes').update({ status: 'invoiced' }).eq('id', quote_id);
  }
  // Advance linked project to invoiced
  if (project_id) {
    await supabase.from('projects').update({ status: 'invoiced' }).eq('id', project_id);
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}
