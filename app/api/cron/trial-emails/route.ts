import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch all trialing contractors
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, first_name, trial_ends_at')
    .eq('subscription_status', 'trialing')
    .not('trial_ends_at', 'is', null);

  if (!profiles?.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;

  for (const profile of profiles) {
    const days = daysUntil(profile.trial_ends_at!);
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
    const email = authUser.user?.email;
    if (!email) continue;

    const name = profile.first_name ?? 'there';
    const dashUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    if (days === 7) {
      await sendEmail(email, "How's TradeDesk going?", `
        <p>Hi ${name},</p>
        <p>You've been on TradeDesk for about a week — how's it going?</p>
        <p>If you haven't already, connect your Stripe account so you can accept online payments from clients.</p>
        <p><a href="${dashUrl}">Go to dashboard →</a></p>`
      );
      sent++;
    } else if (days === 5) {
      await sendEmail(email, 'Your free month ends in 5 days', `
        <p>Hi ${name},</p>
        <p>Just a heads up — your free trial ends in 5 days. After that, TradeDesk is $29/mo plus 0.5% on payments we process for you.</p>
        <p>If you want to cancel before then, just reply to this email.</p>
        <p><a href="${dashUrl}">Go to dashboard →</a></p>`
      );
      sent++;
    } else if (days === 2) {
      await sendEmail(email, '2 days left on your trial', `
        <p>Hi ${name},</p>
        <p>Your free trial ends in 2 days. Your card will be charged $29 on day 31 unless you cancel.</p>
        <p>Questions? Just reply to this email.</p>
        <p><a href="${dashUrl}">Go to dashboard →</a></p>`
      );
      sent++;
    } else if (days === 0) {
      // Trial just expired — subscription webhook will handle status, this is the final nudge
      await sendEmail(email, 'Your trial has ended', `
        <p>Hi ${name},</p>
        <p>Your free trial has ended. If your payment went through, you're now a Pro member — welcome!</p>
        <p>If you have any issues, reply to this email and we'll sort it out.</p>
        <p><a href="${dashUrl}">Go to dashboard →</a></p>`
      );
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
