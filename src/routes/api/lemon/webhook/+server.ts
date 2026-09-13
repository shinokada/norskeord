/**
 * POST /api/lemon/webhook
 *
 * Receives Lemon Squeezy subscription events and keeps the subscriptions
 * table in Supabase in sync.
 *
 * Register in LS dashboard → Webhooks with events:
 *   subscription_created, subscription_updated, subscription_cancelled,
 *   subscription_expired, subscription_paused, subscription_resumed,
 *   subscription_unpaused
 * (subscription_activated is not a real LS event — that case is unreachable
 * and kept only as a harmless no-op alias.)
 *
 * Uses the Supabase service role client — no user cookie available here.
 */
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, LEMONSQUEEZY_WEBHOOK_SECRET } from '$env/static/private';
import {
  verifyLemonSqueezyWebhook,
  type LemonSqueezyWebhookPayload,
  type SubscriptionStatus
} from '$lib/server/lemonsqueezy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  // 1. Read raw body BEFORE any JSON parsing — signature is over raw bytes
  const rawBody = await request.text();

  // 2. Verify HMAC-SHA256 signature
  const signature = request.headers.get('X-Signature') ?? '';
  const valid = await verifyLemonSqueezyWebhook(rawBody, signature, LEMONSQUEEZY_WEBHOOK_SECRET);
  if (!valid) {
    console.warn('[webhook] Invalid signature');
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse payload
  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;

  if (!userId) {
    // This means the checkout was created without custom.user_id — misconfiguration.
    console.error('[webhook] Missing user_id in custom_data for event:', eventName);
    return json({ error: 'Missing user_id' }, { status: 400 });
  }

  const attrs = payload.data.attributes;
  const subscriptionId = payload.data.id;
  const lsStatus = attrs.status; // LS status string
  // Lemon Squeezy's own event timestamp — used to guard against out-of-order
  // webhook deliveries overwriting newer state with a stale one. Falls back
  // to 'now' in the rare case LS omits it, which is treated as newest (same
  // effective behavior as before this guard existed for that one case).
  const eventAt = attrs.updated_at ?? new Date().toISOString();

  // 4. Service role client — bypasses RLS
  const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 5. Map LS event → our plan/status
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_activated': {
      const ourStatus: SubscriptionStatus =
        lsStatus === 'active' || lsStatus === 'on_trial' ? 'active' : 'past_due';
      // 'unpaid' means a renewal payment failed and LS is (or has finished) dunning.
      // Lemon Squeezy can leave a subscription in this state indefinitely with no
      // ends_at set, so we must not grant Plus while status is unpaid — otherwise
      // a null valid_until would let hooks.server.ts treat access as never-expiring.
      const plan = lsStatus === 'unpaid' ? 'free' : 'plus';

      const { data: applied, error } = await supabase.rpc('upsert_subscription_if_newer', {
        p_user_id: userId,
        p_plan: plan,
        p_status: ourStatus,
        p_billing_interval: attrs.billing_interval ?? null,
        p_valid_until: attrs.ends_at ?? null,
        p_subscription_id: subscriptionId,
        p_customer_id: String(attrs.customer_id),
        p_order_id: String(attrs.order_id),
        p_event_at: eventAt
      });

      if (error) {
        console.error('[webhook] upsert failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      if (!applied) {
        console.log('[webhook] Skipped stale event:', eventName, subscriptionId);
      }
      break;
    }

    case 'subscription_cancelled': {
      // User cancelled — keep plan='plus' until valid_until (LS standard).
      // p_plan/p_billing_interval: null preserves whatever is already stored.
      const { data: applied, error } = await supabase.rpc('upsert_subscription_if_newer', {
        p_user_id: userId,
        p_plan: null,
        p_status: 'cancelled' satisfies SubscriptionStatus,
        p_billing_interval: null,
        p_valid_until: attrs.ends_at ?? null,
        p_subscription_id: subscriptionId,
        p_customer_id: String(attrs.customer_id),
        p_order_id: String(attrs.order_id),
        p_event_at: eventAt
      });

      if (error) {
        console.error('[webhook] cancel update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      if (!applied) {
        console.log('[webhook] Skipped stale event:', eventName, subscriptionId);
      }
      break;
    }

    case 'subscription_expired': {
      // Period ended — downgrade to free
      const { data: applied, error } = await supabase.rpc('upsert_subscription_if_newer', {
        p_user_id: userId,
        p_plan: 'free',
        p_status: 'expired' satisfies SubscriptionStatus,
        p_billing_interval: null,
        p_valid_until: null,
        p_subscription_id: subscriptionId,
        p_customer_id: String(attrs.customer_id),
        p_order_id: String(attrs.order_id),
        p_event_at: eventAt
      });

      if (error) {
        console.error('[webhook] expire update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      if (!applied) {
        console.log('[webhook] Skipped stale event:', eventName, subscriptionId);
      }
      break;
    }

    case 'subscription_paused': {
      // p_valid_until: preserve existing value. Since the RPC has no
      // "preserve" semantics for valid_until (unlike plan/billing_interval),
      // we pass through attrs.ends_at, which LS keeps set to the same value
      // it already had while paused (pause doesn't change the period end).
      const { data: applied, error } = await supabase.rpc('upsert_subscription_if_newer', {
        p_user_id: userId,
        p_plan: null,
        p_status: 'past_due' satisfies SubscriptionStatus,
        p_billing_interval: null,
        p_valid_until: attrs.ends_at ?? null,
        p_subscription_id: subscriptionId,
        p_customer_id: String(attrs.customer_id),
        p_order_id: String(attrs.order_id),
        p_event_at: eventAt
      });

      if (error) {
        console.error('[webhook] pause update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      if (!applied) {
        console.log('[webhook] Skipped stale event:', eventName, subscriptionId);
      }
      break;
    }

    case 'subscription_resumed':
    case 'subscription_unpaused': {
      // Both mean billing is active again: 'resumed' = un-cancelled before
      // expiry, 'unpaused' = came off a dunning/payment pause.
      const { data: applied, error } = await supabase.rpc('upsert_subscription_if_newer', {
        p_user_id: userId,
        p_plan: null,
        p_status: 'active' satisfies SubscriptionStatus,
        p_billing_interval: null,
        p_valid_until: attrs.ends_at ?? null,
        p_subscription_id: subscriptionId,
        p_customer_id: String(attrs.customer_id),
        p_order_id: String(attrs.order_id),
        p_event_at: eventAt
      });

      if (error) {
        console.error('[webhook] resume/unpause update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      if (!applied) {
        console.log('[webhook] Skipped stale event:', eventName, subscriptionId);
      }
      break;
    }

    default:
      // Unknown event — log and return 200 so LS doesn't keep retrying
      console.log('[webhook] Unhandled event:', eventName);
  }

  return new Response(null, { status: 200 });
};
