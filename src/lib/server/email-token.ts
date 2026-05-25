/**
 * email-token.ts
 *
 * Generates signed unsubscribe URLs for lesson and reminder emails.
 *
 * Token: HMAC-SHA256(UNSUBSCRIBE_SECRET, userId) as hex
 *
 * URL format:
 *   /api/email/unsubscribe?uid=<userId>&token=<hmac>&action=<lesson|reminder>
 */

import { createHmac } from 'crypto';
import { UNSUBSCRIBE_SECRET, APP_URL } from '$env/static/private';

export type UnsubscribeAction = 'lesson' | 'reminder';

export function unsubscribeUrl(
  userId: string,
  action: UnsubscribeAction = 'lesson',
  baseUrl: string = APP_URL
): string {
  const token = createHmac('sha256', UNSUBSCRIBE_SECRET).update(userId).digest('hex');
  return `${baseUrl}/api/email/unsubscribe?uid=${userId}&token=${token}&action=${action}`;
}
