/**
 * Edge Function: send-push-reminders
 *
 * Save this file to:
 *   supabase/functions/send-push-reminders/index.ts
 *
 * Then deploy with:
 *   npx supabase functions deploy send-push-reminders
 *
 * Schedule via Supabase Dashboard → Database → Cron jobs:
 *   Schedule:  0 19 * * *          (daily at 19:00 UTC)
 *   Command:   SELECT net.http_post(
 *                url := 'https://<project-ref>.supabase.co/functions/v1/send-push-reminders',
 *                headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb
 *              );
 *
 * Or via pg_cron (if the extension is enabled):
 *   SELECT cron.schedule(
 *     'send-push-reminders',
 *     '0 19 * * *',
 *     $$SELECT net.http_post(
 *         url := 'https://<project-ref>.supabase.co/functions/v1/send-push-reminders',
 *         headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb
 *       )$$
 *   );
 *
 * Required environment variables (set in Supabase Dashboard → Settings → Edge Functions):
 *   VAPID_SUBJECT        e.g. "mailto:hello@norskeord.com"
 *   VAPID_PUBLIC_KEY     URL-safe base64 VAPID public key
 *   VAPID_PRIVATE_KEY    URL-safe base64 VAPID private key
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
 *
 * Logic:
 *   1. Find all Plus users with daily_reminder=true and a push_subscription stored.
 *   2. Exclude users who already have a study_days row for today (UTC).
 *   3. For each remaining user, count their cards due today from card_progress
 *      (due <= now()) and send a Web Push notification.
 *   4. Body: "{n} cards due today — keep your streak going 🔥"
 *      (or "You have cards due today — keep your streak going 🔥" if count is 0,
 *       which can happen when cards become due after this function runs.)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface ProfileRow {
  id: string;
  push_subscription: PushSubscriptionJSON;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Count cards due today (or earlier) for a given user. */
async function countDueCards(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('card_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('due', new Date().toISOString());

  if (error) {
    console.warn(`[send-push-reminders] countDueCards failed for ${userId}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/** Build the notification body string. */
function buildBody(dueCount: number): string {
  if (dueCount <= 0) {
    return 'You have cards due today — keep your streak going 🔥';
  }
  return `${dueCount} card${dueCount === 1 ? '' : 's'} due today — keep your streak going 🔥`;
}

/** Send a Web Push notification to a single subscription. */
async function sendPush(
  subscription: PushSubscriptionJSON,
  payload: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await webpush.sendNotification(subscription, payload);
    return { ok: true };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const message = (err as Error).message ?? String(err);

    // 404 / 410 means the subscription is no longer valid — caller should clean it up.
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, error: `gone:${statusCode}` };
    }
    return { ok: false, error: message };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Accept POST (from cron / pg_cron http_post) or GET (manual trigger / health check).
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ── Env vars ────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'Missing VAPID env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Configure web-push once with VAPID details.
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceKey);

  // ── Today's date (UTC) ───────────────────────────────────────────────────────
  const todayUtc = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // ── 1. Fetch eligible profiles ───────────────────────────────────────────────
  // Plus users with daily_reminder=true and a stored push_subscription.
  // We join via the subscriptions table to confirm plan='plus'.
  // Using .not('push_subscription', 'is', null) filters rows where the column is NULL.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, push_subscription')
    .eq('daily_reminder', true)
    .not('push_subscription', 'is', null);

  if (profilesError) {
    console.error('[send-push-reminders] Failed to fetch profiles:', profilesError.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!profiles || profiles.length === 0) {
    console.log('[send-push-reminders] No eligible users found.');
    return new Response(JSON.stringify({ ok: true, sent: 0, skipped: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eligibleIds = profiles.map((p: ProfileRow) => p.id);

  // ── 2. Exclude users who already studied today ───────────────────────────────
  const { data: studiedToday, error: studiedError } = await supabase
    .from('study_days')
    .select('user_id')
    .in('user_id', eligibleIds)
    .eq('day', todayUtc);

  if (studiedError) {
    console.error('[send-push-reminders] Failed to fetch study_days:', studiedError.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch study_days' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const studiedSet = new Set((studiedToday ?? []).map((r: { user_id: string }) => r.user_id));
  const toNotify = (profiles as ProfileRow[]).filter((p) => !studiedSet.has(p.id));

  console.log(
    `[send-push-reminders] eligible=${eligibleIds.length} already_studied=${studiedSet.size} to_notify=${toNotify.length}`
  );

  if (toNotify.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, skipped: eligibleIds.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ── 3. Send notifications ────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;
  const staleSubscriptions: string[] = []; // user IDs whose subscriptions are gone

  for (const profile of toNotify) {
    const dueCount = await countDueCards(supabase, profile.id);
    const payload = JSON.stringify({
      title: 'Norskeord',
      body: buildBody(dueCount)
    });

    const result = await sendPush(profile.push_subscription, payload);

    if (result.ok) {
      sent++;
      console.log(`[send-push-reminders] sent to user=${profile.id} due=${dueCount}`);
    } else {
      failed++;
      console.warn(`[send-push-reminders] failed for user=${profile.id} error=${result.error}`);
      // Mark stale subscriptions (410 Gone / 404 Not Found) for cleanup.
      if (result.error?.startsWith('gone:')) {
        staleSubscriptions.push(profile.id);
      }
    }
  }

  // ── 4. Clean up stale subscriptions ─────────────────────────────────────────
  // If a push endpoint returned 410/404, the subscription is no longer valid.
  // Clear push_subscription and daily_reminder to avoid wasting future requests.
  if (staleSubscriptions.length > 0) {
    const { error: cleanupError } = await supabase
      .from('profiles')
      .update({ push_subscription: null, daily_reminder: false })
      .in('id', staleSubscriptions);

    if (cleanupError) {
      console.warn(
        '[send-push-reminders] Failed to clean stale subscriptions:',
        cleanupError.message
      );
    } else {
      console.log(
        `[send-push-reminders] Cleaned ${staleSubscriptions.length} stale subscription(s).`
      );
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sent,
      failed,
      skipped: studiedSet.size,
      stale_cleaned: staleSubscriptions.length
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
