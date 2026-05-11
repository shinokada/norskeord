/**
 * Shared Lemon Squeezy helpers.
 * No API calls here — pure signature verification + shared types.
 */

/**
 * Verify the X-Signature header on incoming webhooks.
 * Lemon Squeezy signs with HMAC-SHA256 over the raw request body.
 *
 * @param rawBody   The raw request body string (read BEFORE JSON.parse)
 * @param signature The value of the X-Signature header
 * @param secret    LEMONSQUEEZY_WEBHOOK_SECRET from env
 */
export async function verifyLemonSqueezyWebhook(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return computed === signature;
}

// ── Webhook payload types ────────────────────────────────────────────────────

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string; // e.g. 'subscription_created'
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string; // Lemon Squeezy subscription ID
    attributes: {
      order_id: number;
      customer_id: number;
      variant_id: number;
      /** 'active' | 'cancelled' | 'expired' | 'past_due' | 'on_trial' | 'paused' */
      status: string;
      /** ISO date string for the end of the current billing period, or null */
      ends_at: string | null;
      /** Billing interval: 'month' | 'year' */
      billing_interval?: string;
    };
  };
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'inactive' | 'past_due';
