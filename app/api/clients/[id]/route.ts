import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [clientRes, quotesRes, invoicesRes, projectsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('quotes').select('*').eq('client_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('client_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('projects').select('*').eq('client_id', id).eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  if (clientRes.error || !clientRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    client: clientRes.data,
    quotes: quotesRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    projects: projectsRes.data ?? [],
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, notes } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (name !== undefined) updates.name = name.trim();
  if (email !== undefined) updates.email = email?.trim() || null;
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (address !== undefined) updates.address = address?.trim() || null;
  if (notes !== undefined) updates.notes = notes?.trim() || null;

  const { data, error } = await supabase.from('clients')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
