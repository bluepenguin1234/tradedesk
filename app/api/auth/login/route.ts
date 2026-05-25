import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = (form.get('email') as string)?.trim().toLowerCase();
  const password = form.get('password') as string;

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?error=missing_fields', req.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', req.url));
  }

  return NextResponse.redirect(new URL('/dashboard', req.url));
}
