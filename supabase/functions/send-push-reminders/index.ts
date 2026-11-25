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
 *   CRON_SECRET          shared secret. The cron job sends it in the x-cron-secret header;
 *                        requests without the right value get 401.
 *
 * Optional secrets:
 *   EMAIL_DAILY_BUDGET   max reminder emails per day (default 60). Keeps room in
 *                        Resend's 100/day free quota for sign-in codes.
 *
 * SUPABASE_URL and SUPABASE_SECRET_KEYS are injected automatically.
 *
 * Query parameters:
 *   ?send=1              actually send. Without it the function is a dry run: it runs all the
 *                        filtering, sends nothing, writes nothing, and returns counts.
 *                        The cron job calls the function with ?send=1.
 *   ?dry_run=1           force a dry run even if ?send=1 is present.
 *
 * Logic:
 *   1. Find all users with daily_reminder=true (push) or email_reminder=true (email).
 *      Push is Plus-only because only Plus users can turn it on in the UI. Email
 *      reminders are on for every user by default (set at the end of onboarding).
 *   2. Exclude users who already have a study_days row for today (UTC).
 *   3. Email sunset rule (push is not affected). A user is emailed only if:
 *        (a) they last studied within EMAIL_MAX_INACTIVE_DAYS days, or
 *        (b) they have never studied and the account is at most EMAIL_NEWCOMER_DAYS old.
 *      A returning user (has studied before) with no cards due is not emailed.
 *   4. Email budget: at most EMAIL_DAILY_BUDGET emails per day (minus the ones already
 *      logged today). Most recently active users come first, then the newest accounts.
 *   5. Skip emailing anyone already logged in email_log for 'daily_reminder' today
 *      (idempotency guard against repeat invocations).
 *   6. Clean up stale push subscriptions (410/404 responses).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';
import { Resend } from 'npm:resend';
import { createHmac, timingSafeEqual } from 'node:crypto';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Email only users who studied within this many days. */
const EMAIL_MAX_INACTIVE_DAYS = 14;
/** Email users who never studied only while their account is at most this many days old. */
const EMAIL_NEWCOMER_DAYS = 7;
/** Default cap on reminder emails per day. Override with the EMAIL_DAILY_BUDGET secret. */
const DEFAULT_EMAIL_DAILY_BUDGET = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

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
}

/** One row of the get_emails_for_users() RPC. */
interface RecipientRow {
  id: string;
  email: string;
  created_at: string;
  last_study_day: string | null; // "YYYY-MM-DD", null = never studied
}

interface EmailPlan {
  profileId: string;
  email: string;
  dueCount: number;
  hasStudied: boolean;
  lastStudyDay: string | null;
  createdAt: string;
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

/** Body of the push notification. */
function buildPushBody(): string {
  return 'Time to practice — keep your streak going 🔥';
}

/** Body of the reminder email. */
function buildEmailBody(dueCount: number, hasStudied: boolean): string {
  if (!hasStudied) {
    return 'Your first study session is a few cards away. Start whenever you are ready.';
  }
  if (dueCount > 0) {
    const cards = dueCount === 1 ? '1 card is' : `${dueCount} cards are`;
    return `${cards} due today. Keep your streak going 🔥`;
  }
  return 'Time to practice. Keep your streak going 🔥';
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
function buildReminderEmail(
  dueCount: number,
  hasStudied: boolean,
  appUrl: string,
  unsubUrl: string
): string {
  const bodyText = buildEmailBody(dueCount, hasStudied);
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
    You're receiving this because daily email reminders are on for your Norskeord account.
    You can turn them off in your <a href="${appUrl}/my-profile" style="color:#999">profile</a> or
    <a href="${unsubUrl}" style="color:#999">unsubscribe here</a>.
  </p>

</body>
</html>`;
}

/** Whole days between a "YYYY-MM-DD" day and today (UTC). */
function daysSinceDay(day: string, todayUtc: string): number {
  return Math.floor(
    (Date.parse(`${todayUtc}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / DAY_MS
  );
}

/** Read the email budget from the environment, falling back to the default. */
function readEmailBudget(): number {
  const raw = Deno.env.get('EMAIL_DAILY_BUDGET');
  if (!raw) return DEFAULT_EMAIL_DAILY_BUDGET;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_EMAIL_DAILY_BUDGET;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Only the cron job (or someone holding CRON_SECRET) may call this function.
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: 'Missing CRON_SECRET' }), { status: 500 });
  }
  const digest = (s: string) => createHmac('sha256', 'send-push-reminders').update(s).digest();
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!timingSafeEqual(digest(provided), digest(cronSecret))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Dry run unless the caller explicitly asks to send with ?send=1.
  const params = new URL(req.url).searchParams;
  const dryRun = params.get('send') !== '1' || params.get('dry_run') === '1';

  // ── Env vars ────────────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const serviceKey = secretKeys['default'];
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  const appUrl = Deno.env.get('APP_URL');
  const unsubSecret = Deno.env.get('UNSUBSCRIBE_SECRET');
  const emailBudget = readEmailBudget();

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
    return new Response(
      JSON.stringify({ ok: true, dry_run: dryRun, push_sent: 0, email_sent: 0, skipped: 0 }),
      { status: 200 }
    );
  }

  const eligibleIds = (profiles as ProfileRow[]).map((p) => p.id);

  // ── 2. Exclude users who already studied today ───────────────────────────────
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

  // ── 3. Idempotency guard: skip emails already sent today ─────────────────────
  // Prevents duplicate reminder emails if this function is invoked more than
  // once on the same UTC day (manual test runs, cron retries, etc). Push
  // notifications are cheap/harmless to resend, so only email is guarded here.
  // Relies on email_log allowing one 'daily_reminder' row per user per day
  // (migration 036_email_log_daily_unique.sql).
  const todayStart = `${todayUtc}T00:00:00.000Z`;
  const { data: alreadyEmailedRows, error: emailLogError } = await supabase
    .from('email_log')
    .select('user_id')
    .eq('email_type', 'daily_reminder')
    .gte('sent_at', todayStart)
    .in('user_id', eligibleIds);

  if (emailLogError) {
    // Non-fatal — log and proceed without the guard rather than blocking all
    // reminders for the day.
    console.warn('[send-reminders] Failed to fetch email_log:', emailLogError.message);
  }

  const alreadyEmailedSet = new Set(
    (alreadyEmailedRows ?? []).map((r: { user_id: string }) => r.user_id)
  );

  // ── 4. Decide who gets an email ──────────────────────────────────────────────
  const dueCache = new Map<string, number>();
  const getDueCount = async (userId: string): Promise<number> => {
    const cached = dueCache.get(userId);
    if (cached !== undefined) return cached;
    const n = await countDueCards(supabase, userId);
    dueCache.set(userId, n);
    return n;
  };

  const emailCandidates = toNotify.filter((p) => p.email_reminder && !alreadyEmailedSet.has(p.id));

  let emailSkippedSunset = 0;
  let emailSkippedNoDue = 0;
  let emailSkippedNoAddress = 0;
  let emailDroppedBudget = 0;
  const emailPlans: EmailPlan[] = [];

  if (emailCandidates.length > 0) {
    // Address, account age and last study day in one call (see migration 035).
    const { data: recipients, error: recipientsError } = await supabase.rpc(
      'get_emails_for_users',
      {
        p_ids: emailCandidates.map((p) => p.id)
      }
    );

    if (recipientsError) {
      // Non-fatal — push notifications can still proceed.
      console.error('[send-reminders] Failed to fetch recipients:', recipientsError.message);
      emailSkippedNoAddress = emailCandidates.length;
    } else {
      const recipientById = new Map<string, RecipientRow>(
        ((recipients ?? []) as RecipientRow[]).map((r) => [r.id, r])
      );

      for (const profile of emailCandidates) {
        const r = recipientById.get(profile.id);
        if (!r) {
          console.warn(`[send-reminders] no email found for user=${profile.id} — skipping email`);
          emailSkippedNoAddress++;
          continue;
        }

        const hasStudied = r.last_study_day !== null;

        // Sunset rule.
        const withinActiveWindow =
          hasStudied &&
          daysSinceDay(r.last_study_day as string, todayUtc) <= EMAIL_MAX_INACTIVE_DAYS;
        const isNewcomer =
          !hasStudied && (Date.now() - Date.parse(r.created_at)) / DAY_MS <= EMAIL_NEWCOMER_DAYS;
        if (!withinActiveWindow && !isNewcomer) {
          emailSkippedSunset++;
          continue;
        }

        // Returning users with nothing due are not emailed.
        const dueCount = await getDueCount(profile.id);
        if (hasStudied && dueCount === 0) {
          emailSkippedNoDue++;
          continue;
        }

        emailPlans.push({
          profileId: profile.id,
          email: r.email,
          dueCount,
          hasStudied,
          lastStudyDay: r.last_study_day,
          createdAt: r.created_at
        });
      }
    }
  }

  // ── 4b. Daily budget, most recently active first ─────────────────────────────
  emailPlans.sort((a, b) => {
    if (a.hasStudied !== b.hasStudied) return a.hasStudied ? -1 : 1;
    if (a.hasStudied && b.hasStudied) {
      return (b.lastStudyDay as string).localeCompare(a.lastStudyDay as string);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const budgetLeft = Math.max(0, emailBudget - alreadyEmailedSet.size);
  if (emailPlans.length > budgetLeft) {
    emailDroppedBudget = emailPlans.length - budgetLeft;
    emailPlans.length = budgetLeft;
  }
  const emailPlanById = new Map(emailPlans.map((p) => [p.profileId, p]));

  console.log(
    `[send-reminders] dry_run=${dryRun} eligible=${eligibleIds.length} already_studied=${studiedSet.size} ` +
      `to_notify=${toNotify.length} email_candidates=${emailCandidates.length} ` +
      `email_to_send=${emailPlans.length} skipped_sunset=${emailSkippedSunset} ` +
      `skipped_no_due=${emailSkippedNoDue} skipped_no_address=${emailSkippedNoAddress} ` +
      `dropped_budget=${emailDroppedBudget} already_emailed_today=${alreadyEmailedSet.size}`
  );

  const pushCandidates = toNotify.filter((p) => p.daily_reminder && p.push_subscription);

  const summary = {
    email_candidates: emailCandidates.length,
    email_skipped_sunset: emailSkippedSunset,
    email_skipped_no_due: emailSkippedNoDue,
    email_skipped_no_address: emailSkippedNoAddress,
    email_dropped_budget: emailDroppedBudget,
    email_already_sent: alreadyEmailedSet.size,
    skipped: studiedSet.size
  };

  if (dryRun) {
    return new Response(
      JSON.stringify({
        ok: true,
        dry_run: true,
        push_would_send: pushCandidates.length,
        email_would_send: emailPlans.length,
        ...summary
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (pushCandidates.length === 0 && emailPlans.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, dry_run: false, push_sent: 0, email_sent: 0, ...summary }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Send notifications ────────────────────────────────────────────────────
  let pushSent = 0;
  let pushFailed = 0;
  let emailSent = 0;
  let emailFailed = 0;
  const staleSubscriptions: string[] = [];

  // ── Web push ──────────────────────────────────────────────────────────────────
  for (const profile of pushCandidates) {
    const payload = JSON.stringify({ title: 'Norskeord', body: buildPushBody() });
    const result = await sendPush(profile.push_subscription as PushSubscriptionJSON, payload);
    if (result.ok) {
      pushSent++;
      console.log(`[send-reminders] push sent to user=${profile.id}`);
    } else {
      pushFailed++;
      if (result.stale) staleSubscriptions.push(profile.id);
    }
  }

  // ── Email ─────────────────────────────────────────────────────────────────────
  for (const plan of emailPlanById.values()) {
    const unsubUrl = buildUnsubscribeUrl(plan.profileId, unsubSecret, appUrl);
    const html = buildReminderEmail(plan.dueCount, plan.hasStudied, appUrl, unsubUrl);

    const { error: sendErr } = await resend.emails.send({
      from: emailFrom,
      to: plan.email,
      subject: 'Your Norwegian cards are waiting 🇳🇴',
      html
    });

    if (sendErr) {
      console.error(`[send-reminders] email failed for user=${plan.profileId}:`, sendErr.message);
      emailFailed++;
    } else {
      emailSent++;
      console.log(`[send-reminders] email sent to user=${plan.profileId} due=${plan.dueCount}`);

      // Record the send so a repeat invocation today won't re-send.
      const { error: logErr } = await supabase
        .from('email_log')
        .insert({ user_id: plan.profileId, email_type: 'daily_reminder' });
      if (logErr) {
        console.warn(
          `[send-reminders] Failed to record email_log for user=${plan.profileId}:`,
          logErr.message
        );
      }
    }

    // 50 ms pause — stay within Resend's rate limits (same as send-lesson-email).
    await new Promise((r) => setTimeout(r, 50));
  }

  // ── 6. Clean up stale push subscriptions ────────────────────────────────────
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
      dry_run: false,
      push_sent: pushSent,
      push_failed: pushFailed,
      email_sent: emailSent,
      email_failed: emailFailed,
      stale_cleaned: staleSubscriptions.length,
      ...summary
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
