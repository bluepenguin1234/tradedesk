import { Resend } from 'resend';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL is not set');

  const { data, error } = await getResend().emails.send({ from, to, subject, html });
  if (error) {
    // Resend returns errors as objects; normalize to a thrown Error so callers can try/catch uniformly.
    throw new Error(error.message ?? 'Resend rejected the email');
  }
  return data;
}
