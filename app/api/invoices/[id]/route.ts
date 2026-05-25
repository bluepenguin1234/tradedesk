import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { LineItem } from '@/types';

function calcTotals(lineItems: LineItem[], taxRate: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  const total = subtotal * (1 + taxRate / 100);
  return { subtotal, total };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(name, email), projects(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ invoice: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  const allowed = ['client_id', 'project_id', 'due_date', 'notes', 'status'];
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Manual mark-as-paid
  if (body.status === 'paid' && !updates.paid_at) {
    updates.paid_at = new Date().toISOString();
  }

  if (body.line_items !== undefined || body.tax_rate !== undefined) {
    const { data: current } = await supabase.from('invoices').select('line_items, tax_rate').eq('id', id).single();
    const lineItems: LineItem[] = body.line_items ?? current?.line_items ?? [];
    const taxRate: number = body.tax_rate ?? current?.tax_rate ?? 0;
    const { subtotal, total } = calcTotals(lineItems, taxRate);
    updates.line_items = lineItems;
    updates.tax_rate = taxRate;
    updates.subtotal = subtotal;
    updates.total = total;
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data });
}
