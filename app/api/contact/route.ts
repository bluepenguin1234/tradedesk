import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const { name, email, trade, message } = await req.json();

  if (!name || !email || !trade) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await sendEmail(
    process.env.RESEND_FROM_EMAIL!,
    `Website enquiry from ${name} (${trade})`,
    `<p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Trade:</strong> ${trade}</p>
    <p><strong>Message:</strong> ${message || '(none)'}</p>
    <p><a href="mailto:${email}">Reply to ${name} →</a></p>`
  );

  return NextResponse.json({ ok: true });
}
