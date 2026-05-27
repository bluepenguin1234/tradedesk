import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('logo') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const allowed = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const path = `${user.id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ logo_url: publicUrl })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ logo_url: publicUrl });
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase.storage.from('logos').remove([
    `${user.id}/logo.png`,
    `${user.id}/logo.jpg`,
    `${user.id}/logo.jpeg`,
    `${user.id}/logo.webp`,
    `${user.id}/logo.svg`,
  ]);

  await supabase.from('profiles').update({ logo_url: null }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
