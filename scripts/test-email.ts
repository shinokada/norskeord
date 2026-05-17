/**
 * test-email.ts
 *
 * Sends a simple test email via Resend to verify the domain and API key are working.
 *
 * Usage:
 *   pnpm tsx --env-file=.env scripts/test-email.ts
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const from = process.env.EMAIL_FROM!;
const to = 'okada.shin.no@gmail.com'; // change if needed

console.log(`Sending test email...`);
console.log(`  From: ${from}`);
console.log(`  To:   ${to}`);

const { data, error } = await resend.emails.send({
  from,
  to,
  subject: 'Norskeord — test email',
  html: '<h1>It works!</h1><p>Resend is configured correctly for norskeord.no.</p>'
});

if (error) {
  console.error('Failed:', error);
  process.exit(1);
}

console.log('Sent! ID:', data?.id);
