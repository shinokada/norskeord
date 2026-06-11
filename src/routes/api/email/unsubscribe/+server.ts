/**
 * GET /api/email/unsubscribe?uid=<userId>&token=<hmac>&action=<lesson|reminder>
 *
 * One-click unsubscribe link included in every lesson and reminder email.
 * Verifies the HMAC token then applies the correct DB write based on action:
 *
 *   action=lesson   → sets email_subscribers.active = false  (default, backwards-compatible)
 *   action=reminder → sets profiles.email_reminder = false
 *
 * Token is generated with: HMAC-SHA256(UNSUBSCRIBE_SECRET, userId)
 * See src/lib/server/email-token.ts for the generation helper.
 */

import { createClient } from '@supabase/supabase-js';
import { UNSUBSCRIBE_SECRET, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createHmac, timingSafeEqual } from 'crypto';
import type { RequestHandler } from './$types';

function verifyToken(userId: string, token: string): boolean {
  const expected = createHmac('sha256', UNSUBSCRIBE_SECRET).update(userId).digest('hex');
  try {
    const a = new Uint8Array(Buffer.from(token, 'hex'));
    const b = new Uint8Array(Buffer.from(expected, 'hex'));
    return a.byteLength === b.byteLength && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function html(title: string, heading: string, body: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Norskeord</title>
  <style>
    body { font-family: Georgia, serif; max-width: 480px; margin: 80px auto; padding: 0 24px; color: #1a1a1a; }
    h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }
    p  { color: #555; line-height: 1.6; }
    a  { color: #2d6a4f; }
  </style>
</head>
<body>
  <h1>${heading}</h1>
  <p>${body}</p>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export const GET: RequestHandler = async ({ url }) => {
  const userId = url.searchParams.get('uid');
  const token = url.searchParams.get('token');
  const action = url.searchParams.get('action') ?? 'lesson';

  if (!userId || !token) {
    return html(
      'Invalid link',
      'Invalid link',
      'This unsubscribe link is missing required parameters.'
    );
  }

  if (!verifyToken(userId, token)) {
    return html(
      'Invalid link',
      'Invalid link',
      'This unsubscribe link is invalid or has been tampered with.'
    );
  }

  const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (action === 'welcome') {
    // Welcome email is one-time only; unsubscribing just confirms no further onboarding emails.
    // The email_log row already exists, so nothing to write — just acknowledge.
    return html(
      'Unsubscribed',
      'Got it',
      'You will not receive any further onboarding emails from Norskeord. ' +
        'You can still use the app at <a href="/">norskeord.no</a> any time.'
    );
  }

  if (action === 'reminder') {
    // Daily email reminder — clear the toggle in profiles
    const { error } = await supabase
      .from('profiles')
      .update({ email_reminder: false })
      .eq('id', userId);

    if (error) {
      console.error('[unsubscribe] reminder DB error:', error.message);
      return html(
        'Something went wrong',
        'Something went wrong',
        'We could not process your request. Please try again or contact us.'
      );
    }

    return html(
      'Unsubscribed',
      'You have been unsubscribed',
      'You will no longer receive daily reminder emails from Norskeord. ' +
        'You can re-enable them at any time from your <a href="/my-profile">profile settings</a>.'
    );
  }

  // Default: action=lesson — clear the lesson email subscription
  const { error } = await supabase
    .from('email_subscribers')
    .update({ active: false })
    .eq('user_id', userId);

  if (error) {
    console.error('[unsubscribe] lesson DB error:', error.message);
    return html(
      'Something went wrong',
      'Something went wrong',
      'We could not process your request. Please try again or contact us.'
    );
  }

  return html(
    'Unsubscribed',
    'You have been unsubscribed',
    'You will no longer receive Norwegian lesson emails from Norskeord. ' +
      'You can re-enable them at any time from your <a href="/my-profile">profile settings</a>.'
  );
};
