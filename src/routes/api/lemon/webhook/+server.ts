/**
 * POST /api/lemon/webhook
 *
 * Receives Lemon Squeezy subscription events and keeps the subscriptions
 * table in Supabase in sync.
 *
 * Register in LS dashboard → Webhooks with events:
 *   subscription_created, subscription_updated, subscription_activated,
 *   subscription_cancelled, subscription_expired,
 *   subscription_paused, subscription_resumed
 *
 * Uses the Supabase service role client — no user cookie available here.
 */
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import {
  SUPABASE_SERVICE_ROLE_KEY,
  LEMONSQUEEZY_WEBHOOK_SECRET
} from '$env/static/private';
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

  // 4. Service role client — bypasses RLS
  const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 5. Map LS event → our plan/status
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_activated': {
      const ourStatus: SubscriptionStatus =
        lsStatus === 'active' || lsStatus === 'on_trial' ? 'active' : 'past_due';

      const { error } = await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          plan: 'plus',
          status: ourStatus,
          billing_interval: attrs.billing_interval ?? null,
          valid_until: attrs.ends_at ?? null,
          lemon_squeezy_subscription_id: subscriptionId,
          lemon_squeezy_customer_id: String(attrs.customer_id),
          lemon_squeezy_order_id: String(attrs.order_id)
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('[webhook] upsert failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      break;
    }

    case 'subscription_cancelled': {
      // User cancelled — keep plan='plus' until valid_until (LS standard)
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled' satisfies SubscriptionStatus,
          valid_until: attrs.ends_at ?? null
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[webhook] cancel update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      break;
    }

    case 'subscription_expired': {
      // Period ended — downgrade to free
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'expired' satisfies SubscriptionStatus,
          valid_until: null
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[webhook] expire update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      break;
    }

    case 'subscription_paused': {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'past_due' satisfies SubscriptionStatus })
        .eq('user_id', userId);

      if (error) {
        console.error('[webhook] pause update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      break;
    }

    case 'subscription_resumed': {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active' satisfies SubscriptionStatus,
          valid_until: attrs.ends_at ?? null
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[webhook] resume update failed:', error);
        return json({ error: 'DB error' }, { status: 500 });
      }
      break;
    }

    default:
      // Unknown event — log and return 200 so LS doesn't keep retrying
      console.log('[webhook] Unhandled event:', eventName);
  }

  return new Response(null, { status: 200 });
};
