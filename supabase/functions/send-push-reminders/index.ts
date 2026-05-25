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
 *   Name:     send-push-reminders
 *   Schedule: 0 19 * * *   (daily at 19:00 UTC = 21:00 Oslo)
 *   Command:  see current-cron-push-notification.sql
 *
 * Required secrets (Supabase Dashboard → Settings → Edge Functions):
 *   VAPID_SUBJECT        e.g. "mailto:hello@norskeord.no"
 *   VAPID_PUBLIC_KEY     URL-safe base64 VAPID public key
 *   VAPID_PRIVATE_KEY    URL-safe base64 VAPID private key
 *   RESEND_API_KEY       Resend API key
 *   EMAIL_FROM           e.g. "Norskeord <no-reply@norskeord.no>"
 *   APP_URL              e.g. "https://norskeord.no"
 *   UNSUBSCRIBE_SECRET   same value as in .env
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
 *
 * Logic:
 *   1. Find all Plus users with daily_reminder=true and a push_subscription stored.
 *   2. Find all Plus users with email_reminder=true.
 *   3. Merge the two sets, exclude users who already have a study_days row for
 *      today (UTC).
 *   4. For each user in the merged set, count their cards due today from
 *      card_progress (due <= now()) and send whichever notifications are enabled.
 *   5. Clean up stale push subscriptions (410/404 responses).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';
import { Resend } from 'npm:resend';
import { createHmac } from 'node:crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface ProfileRow {
  id: string;
  daily_reminder: boolean;
  push_subscription: PushSubscriptionJSON | null;
  email_reminder: boolean;
  email: string | null; // joined from auth.users via the view
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
    console.warn(`[send-reminders] countDueCards failed for ${userId}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

/** Build the notification body string. */
function buildBody(dueCount: number): string {
  if (dueCount <= 0) return 'You have cards due today — keep your streak going 🔥';
  return `${dueCount} card${dueCount === 1 ? '' : 's'} due today — keep your streak going 🔥`;
}

/** Send a Web Push notification to a single subscription. */
async function sendPush(
  subscription: PushSubscriptionJSON,
  payload: string
): Promise<{ ok: boolean; stale?: boolean }> {
  try {
    await webpush.sendNotification(subscription, payload);
    return { ok: true };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const message = (err as Error).message ?? String(err);
    console.warn(`[send-reminders] push failed: ${message}`);
    return { ok: false, stale: statusCode === 404 || statusCode === 410 };
  }
}

/** Build the unsubscribe URL using HMAC — same approach as send-lesson-email. */
function buildUnsubscribeUrl(userId: string, secret: string, appUrl: string): string {
  const token = createHmac('sha256', secret).update(userId).digest('hex');
  return `${appUrl}/api/email/unsubscribe?uid=${userId}&token=${token}&action=reminder`;
}

/** Build the reminder email HTML. */
function buildReminderEmail(dueCount: number, appUrl: string, unsubUrl: string): string {
  const bodyText = buildBody(dueCount);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Norskeord reminder</title>
</head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px 16px">

  <p style="margin:0 0 4px 0;font-size:12px;color:#999;letter-spacing:.05em;text-transform:uppercase">
    Norskeord · Daily reminder
  </p>
  <h1 style="margin:0 0 16px 0;font-size:20px">Your Norwegian cards are waiting 🇳🇴</h1>

  <p style="margin:0 0 24px 0;font-size:15px;color:#333;line-height:1.6">${bodyText}</p>

  <div style="margin-bottom:32px">
    <a href="${appUrl}"
       style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
      Study now →
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px">
  <p style="font-size:12px;color:#999;margin:0">
    You're receiving this because you enabled daily email reminders in your Norskeord profile.<br>
    <a href="${unsubUrl}" style="color:#999">Unsubscribe</a>
  </p>

</body>
</html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // ── Env vars ────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  const appUrl = Deno.env.get('APP_URL');
  const unsubSecret = Deno.env.get('UNSUBSCRIBE_SECRET');

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), { status: 500 });
  }
  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'Missing VAPID env vars' }), { status: 500 });
  }
  if (!resendKey || !emailFrom || !appUrl || !unsubSecret) {
    return new Response(JSON.stringify({ error: 'Missing email env vars' }), { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  const todayUtc = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // ── 1. Fetch all users with either reminder enabled ──────────────────────────
  // We join auth.users for the email address via the same view used by
  // send-lesson-email (email_subscribers_with_email is already in the DB).
  // For push-only users who have no email_reminder we still need the row,
  // so we query profiles directly and get the email separately via the service
  // role client.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, daily_reminder, push_subscription, email_reminder')
    .or('daily_reminder.eq.true,email_reminder.eq.true');

  if (profilesError) {
    console.error('[send-reminders] Failed to fetch profiles:', profilesError.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    console.log('[send-reminders] No eligible users found.');
    return new Response(JSON.stringify({ ok: true, push_sent: 0, email_sent: 0, skipped: 0 }), {
      status: 200
    });
  }

  // ── 2. Fetch email addresses for email_reminder users ────────────────────────
  const emailReminderIds = profiles
    .filter((p: ProfileRow) => p.email_reminder)
    .map((p: ProfileRow) => p.id);

  const emailByUserId = new Map<string, string>();

  if (emailReminderIds.length > 0) {
    // auth.admin.listUsers() returns all users — filter to our set.
    // For large user bases a paginated approach would be needed; fine for now.
    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (usersError) {
      console.error('[send-reminders] Failed to fetch user emails:', usersError.message);
      // Non-fatal — push notifications can still proceed.
    } else {
      const idSet = new Set(emailReminderIds);
      for (const u of usersData.users) {
        if (idSet.has(u.id) && u.email) {
          emailByUserId.set(u.id, u.email);
        }
      }
    }
  }

  const eligibleIds = profiles.map((p: ProfileRow) => p.id);

  // ── 3. Exclude users who already studied today ───────────────────────────────
  const { data: studiedToday, error: studiedError } = await supabase
    .from('study_days')
    .select('user_id')
    .in('user_id', eligibleIds)
    .eq('day', todayUtc);

  if (studiedError) {
    console.error('[send-reminders] Failed to fetch study_days:', studiedError.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch study_days' }), { status: 500 });
  }

  const studiedSet = new Set((studiedToday ?? []).map((r: { user_id: string }) => r.user_id));
  const toNotify = (profiles as ProfileRow[]).filter((p) => !studiedSet.has(p.id));

  console.log(
    `[send-reminders] eligible=${eligibleIds.length} already_studied=${studiedSet.size} to_notify=${toNotify.length}`
  );

  if (toNotify.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, push_sent: 0, email_sent: 0, skipped: eligibleIds.length }),
      { status: 200 }
    );
  }

  // ── 4. Send notifications ────────────────────────────────────────────────────
  let pushSent = 0;
  let pushFailed = 0;
  let emailSent = 0;
  let emailFailed = 0;
  const staleSubscriptions: string[] = [];

  for (const profile of toNotify) {
    const dueCount = await countDueCards(supabase, profile.id);
    const bodyText = buildBody(dueCount);

    // ── Web push ──────────────────────────────────────────────────────────────
    if (profile.daily_reminder && profile.push_subscription) {
      const payload = JSON.stringify({ title: 'Norskeord', body: bodyText });
      const result = await sendPush(profile.push_subscription, payload);
      if (result.ok) {
        pushSent++;
        console.log(`[send-reminders] push sent to user=${profile.id} due=${dueCount}`);
      } else {
        pushFailed++;
        if (result.stale) staleSubscriptions.push(profile.id);
      }
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    if (profile.email_reminder) {
      const toEmail = emailByUserId.get(profile.id);
      if (!toEmail) {
        console.warn(`[send-reminders] no email found for user=${profile.id} — skipping email`);
        emailFailed++;
      } else {
        const unsubUrl = buildUnsubscribeUrl(profile.id, unsubSecret, appUrl);
        const html = buildReminderEmail(dueCount, appUrl, unsubUrl);

        const { error: sendErr } = await resend.emails.send({
          from: emailFrom,
          to: toEmail,
          subject: 'Your Norwegian cards are waiting 🇳🇴',
          html
        });

        if (sendErr) {
          console.error(`[send-reminders] email failed for user=${profile.id}:`, sendErr.message);
          emailFailed++;
        } else {
          emailSent++;
          console.log(`[send-reminders] email sent to user=${profile.id} due=${dueCount}`);
        }

        // 50 ms pause — stay within Resend's rate limits (same as send-lesson-email).
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  // ── 5. Clean up stale push subscriptions ────────────────────────────────────
  if (staleSubscriptions.length > 0) {
    const { error: cleanupError } = await supabase
      .from('profiles')
      .update({ push_subscription: null, daily_reminder: false })
      .in('id', staleSubscriptions);

    if (cleanupError) {
      console.warn('[send-reminders] Failed to clean stale subscriptions:', cleanupError.message);
    } else {
      console.log(`[send-reminders] Cleaned ${staleSubscriptions.length} stale subscription(s).`);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      push_sent: pushSent,
      push_failed: pushFailed,
      email_sent: emailSent,
      email_failed: emailFailed,
      skipped: studiedSet.size,
      stale_cleaned: staleSubscriptions.length
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
