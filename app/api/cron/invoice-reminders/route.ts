import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split('T')[0];
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch all sent/overdue invoices with client info
  const { data: invoices } = await admin
    .from('invoices')
    .select('*, clients(name, email), profiles(first_name, last_name)')
    .in('status', ['sent', 'overdue'])
    .not('due_date', 'is', null);

  if (!invoices?.length) return NextResponse.json({ ok: true, processed: 0 });

  let processed = 0;

  for (const invoice of invoices) {
    const clientEmail = invoice.clients?.email;
    if (!clientEmail) continue;

    const clientName = invoice.clients?.name ?? 'there';
    const contractorName = `${invoice.profiles?.first_name ?? ''} ${invoice.profiles?.last_name ?? ''}`.trim();
    const dueDate = new Date(invoice.due_date).toLocaleDateString();
    const payLink = invoice.stripe_payment_link ?? `${process.env.NEXT_PUBLIC_APP_URL}`;

    if (invoice.due_date < todayStr && invoice.status === 'sent') {
      // Invoice is now overdue — flip status
      await admin.from('invoices').update({ status: 'overdue' }).eq('id', invoice.id);

      await sendEmail(
        clientEmail,
        `Invoice from ${contractorName} is overdue`,
        `<p>Hi ${clientName},</p>
        <p>Your invoice ${invoice.invoice_number} for $${invoice.total.toFixed(2)} from ${contractorName} was due on ${dueDate} and is now overdue.</p>
        <p><a href="${payLink}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Pay Now →</a></p>`
      );
      processed++;
    } else if (invoice.due_date === todayStr) {
      await sendEmail(
        clientEmail,
        `Invoice from ${contractorName} is due today`,
        `<p>Hi ${clientName},</p>
        <p>A friendly reminder that invoice ${invoice.invoice_number} for $${invoice.total.toFixed(2)} from ${contractorName} is due today.</p>
        <p><a href="${payLink}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Pay Now →</a></p>`
      );
      processed++;
    } else if (invoice.due_date === in3Days) {
      await sendEmail(
        clientEmail,
        `Invoice from ${contractorName} is due in 3 days`,
        `<p>Hi ${clientName},</p>
        <p>Invoice ${invoice.invoice_number} for $${invoice.total.toFixed(2)} from ${contractorName} is due on ${dueDate}.</p>
        <p><a href="${payLink}" style="background:#15803d;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block;">Pay Now →</a></p>`
      );
      processed++;
    }
  }

  return NextResponse.json({ ok: true, processed });
}
