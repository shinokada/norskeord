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
      /** Identifies the plan variant. Lemon Squeezy has no billing_interval field on
       *  subscriptions — the interval is derived from this (see billingIntervalFromVariant). */
      variant_id: number;
      /** 'active' | 'cancelled' | 'expired' | 'past_due' | 'on_trial' | 'paused' | 'unpaid' */
      status: string;
      /** ISO date: when access ends. Only set once cancelled/expired; null while active. */
      ends_at: string | null;
      /** ISO date of the next renewal (end of the current paid period) */
      renews_at?: string | null;
      /** ISO date string of when Lemon Squeezy last updated this record */
      updated_at?: string;
    };
  };
}

/**
 * Map a Lemon Squeezy variant_id to our billing_interval.
 * Returns null for an unrecognised variant so the DB keeps its stored value
 * (the RPC COALESCEs a null p_billing_interval).
 */
export function billingIntervalFromVariant(
  variantId: number | string | null | undefined,
  monthlyVariantId: string,
  annualVariantId: string
): 'month' | 'year' | null {
  if (variantId === null || variantId === undefined) return null;
  const id = String(variantId);
  if (id === String(annualVariantId)) return 'year';
  if (id === String(monthlyVariantId)) return 'month';
  return null;
}

/**
 * valid_until for an active-ish subscription: ends_at wins when present
 * (cancelled → access end), otherwise renews_at (end of the current paid period).
 */
export function subscriptionValidUntil(attrs: {
  ends_at?: string | null;
  renews_at?: string | null;
}): string | null {
  return attrs.ends_at ?? attrs.renews_at ?? null;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'inactive' | 'past_due';
