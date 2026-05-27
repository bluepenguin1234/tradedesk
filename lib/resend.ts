import { Resend } from 'resend';

// HTTP headers reject anything outside printable ASCII (including newlines,
// tabs, and control characters). If env vars got copy-pasted with garbage,
// catch it here instead of letting undici choke deep inside the SDK.
function assertValidHeaderValue(name: string, value: string): void {
  if (!/^[\x20-\x7E]+$/.test(value)) {
    throw new Error(`${name} contains characters that are illegal in HTTP headers (whitespace/newlines/control chars). Check that this env var was set to the value you intended.`);
  }
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  assertValidHeaderValue('RESEND_API_KEY', key);
  if (!key.startsWith('re_')) {
    throw new Error('RESEND_API_KEY does not look like a Resend key — should start with "re_".');
  }
  return new Resend(key);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL is not set');
  assertValidHeaderValue('RESEND_FROM_EMAIL', from);

  const { data, error } = await getResend().emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(error.message ?? 'Resend rejected the email');
  }
  return data;
}
