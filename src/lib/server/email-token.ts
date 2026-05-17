/**
 * email-token.ts
 *
 * Generates signed unsubscribe URLs for lesson emails.
 * Import this in the send-lesson-email Edge Function.
 *
 * Token: HMAC-SHA256(UNSUBSCRIBE_SECRET, userId) as hex
 */

import { createHmac } from 'crypto';
import { UNSUBSCRIBE_SECRET, APP_URL } from '$env/static/private';

export function unsubscribeUrl(userId: string, baseUrl: string = APP_URL): string {
  const token = createHmac('sha256', UNSUBSCRIBE_SECRET).update(userId).digest('hex');
  return `${baseUrl}/api/email/unsubscribe?uid=${userId}&token=${token}`;
}
