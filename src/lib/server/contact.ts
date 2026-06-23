/**
 * src/lib/server/contact.ts
 *
 * Shared logic for sending a support contact message.
 * Used by /contact/+page.server.ts.
 * Previously inlined in /my-profile/+page.server.ts as the `supportContact` action.
 */

import {
  RESEND_API_KEY,
  EMAIL_FROM,
  ADMIN_USER_ID,
  SUPABASE_SERVICE_ROLE_KEY
} from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export interface ContactPayload {
  fromEmail: string;
  fromName: string;
  userId: string | null; // null for logged-out users
  plan: 'free' | 'plus';
  subject: string;
  message: string;
  appVersion: string;
  ip: string | null;
  userAgent: string | null;
}

export interface ContactResult {
  ok: boolean;
  error?: string;
}

/**
 * Inserts a row into contact_messages and sends a Resend email to the admin.
 * Safe to call from any server-side context.
 */
export async function sendContactMessage(payload: ContactPayload): Promise<ContactResult> {
  const { fromEmail, fromName, userId, plan, subject, message, appVersion, ip, userAgent } =
    payload;

  const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Persist to DB (non-fatal if it fails — still attempt the email).
  const { error: dbError } = await supabaseAdmin.from('contact_messages').insert({
    user_id: userId ?? null,
    subject,
    message,
    app_version: appVersion || null,
    ip_address: ip,
    user_agent: userAgent
  });

  if (dbError) {
    console.error('[contact] DB insert failed:', dbError.message);
  }

  // 2. Look up the admin email.
  const { data: adminData } = await supabaseAdmin.auth.admin.getUserById(ADMIN_USER_ID);
  const adminEmail = adminData?.user?.email;

  if (!adminEmail) {
    console.error('[contact] Could not resolve admin email');
    return { ok: false, error: 'contact_error_generic' };
  }

  // 3. Send via Resend.
  const planLabel = plan === 'plus' ? 'Plus' : 'Free';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: adminEmail,
      reply_to: fromEmail,
      subject: `[${planLabel} Support] ${subject}`,
      text: [
        `From: ${fromName} <${fromEmail}>`,
        `User ID: ${userId ?? 'guest'}`,
        `Plan: ${planLabel}`,
        `App version: ${appVersion || 'unknown'}`,
        `IP: ${ip ?? 'unknown'}`,
        '',
        message
      ].join('\n')
    })
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[contact] Resend error:', res.status, body);
    return { ok: false, error: 'contact_error_generic' };
  }

  return { ok: true };
}
