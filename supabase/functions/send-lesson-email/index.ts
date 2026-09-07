/**
 * Edge Function: send-lesson-email
 *
 * Sends Norwegian lesson emails to active subscribers on send days.
 * Group A (A1/A2) and Group B (B1/B2) each send on the 1st and 3rd Friday of the month.
 *
 * Deploy:
 *   npx supabase functions deploy send-lesson-email
 *
 * Schedule via Supabase Dashboard → Database → Cron jobs:
 *   Name:     send-lesson-email
 *   Schedule: 0 8 * * 5   (every Friday at 08:00 UTC)
 *   Command:
 *     SELECT net.http_post(
 *       url := 'https://<project-ref>.supabase.co/functions/v1/send-lesson-email',
 *       headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb
 *     );
 *
 * Required secrets (Supabase Dashboard → Settings → Edge Functions):
 *   RESEND_API_KEY
 *   EMAIL_FROM         e.g. "Norskeord <no-reply@norskeord.no>"
 *   APP_URL            e.g. "https://norskeord.no"
 *   UNSUBSCRIBE_SECRET (same value as in .env)
 *
 * SUPABASE_URL and SUPABASE_SECRET_KEYS are injected automatically.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend';
import { createHmac } from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────────────────

type LevelGroup = 'A' | 'B';

interface VocabItem {
  norsk: string;
  english: string;
  example: string;
}

interface Exercise {
  type: 'fill_blank' | 'multiple_choice' | 'reorder';
  prompt: string;
  options?: string[];
  answer: string;
}

interface Lesson {
  id: string;
  level_group: LevelGroup;
  lesson_date: string;
  focus_topic: string;
  main_text: string;
  vocabulary: VocabItem[];
  exercises: Exercise[];
}

interface Subscriber {
  user_id: string;
  level: string;
  email: string;
}

// ── Schedule helpers ───────────────────────────────────────────────────────────

/** Returns true if date is the 1st or 3rd Friday of its month. */
function isSendDay(date: Date): boolean {
  if (date.getDay() !== 5) return false; // must be Friday
  const fridayIndex = Math.ceil(date.getDate() / 7);
  return fridayIndex === 1 || fridayIndex === 3;
}

// ── Token helper ───────────────────────────────────────────────────────────────

function buildUnsubscribeUrl(userId: string, secret: string, appUrl: string): string {
  const token = createHmac('sha256', secret).update(userId).digest('hex');
  return `${appUrl}/api/email/unsubscribe?uid=${userId}&token=${token}`;
}

// ── Email template ─────────────────────────────────────────────────────────────

function buildEmailHtml(
  lesson: Lesson,
  subscriber: Subscriber,
  appUrl: string,
  unsubUrl: string
): string {
  const levelLabel = lesson.level_group === 'A' ? 'A1/A2' : 'B1/B2';
  const dailyPageUrl = `${appUrl}/daily/${lesson.level_group.toLowerCase()}/${lesson.lesson_date}`;

  const vocabRows = lesson.vocabulary
    .map(
      (v) =>
        `<tr>
          <td style="padding:6px 12px 6px 0;vertical-align:top"><strong>${v.norsk}</strong></td>
          <td style="padding:6px 12px 6px 0;vertical-align:top;color:#555">${v.english}</td>
          <td style="padding:6px 0;vertical-align:top;color:#777;font-style:italic">${v.example}</td>
        </tr>`
    )
    .join('');

  const exerciseItems = lesson.exercises
    .map((ex, i) => {
      const opts = ex.options
        ? `<ul style="margin:6px 0 0 16px;padding:0;color:#555">${ex.options.map((o) => `<li>${o}</li>`).join('')}</ul>`
        : '';
      return `<div style="margin-bottom:12px">
        <p style="margin:0"><strong>${i + 1}.</strong> ${ex.prompt}</p>
        ${opts}
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Norskeord — ${lesson.lesson_date}</title>
</head>
<body style="font-family:Georgia,serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px 16px">

  <p style="margin:0 0 4px 0;font-family:sans-serif;font-size:12px;color:#999;letter-spacing:.05em;text-transform:uppercase">
    Norskeord · ${levelLabel} · ${lesson.lesson_date}
  </p>
  <h1 style="margin:0 0 20px 0;font-size:22px;color:#1a1a1a">${lesson.focus_topic}</h1>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#555;border-bottom:1px solid #e0e0e0;padding-bottom:6px;margin-bottom:12px">
    Tekst
  </h2>
  <div style="background:#f9f5f0;border-left:3px solid #2d6a4f;padding:12px 16px;border-radius:0 4px 4px 0;margin-bottom:24px;line-height:1.7">
    ${lesson.main_text.replace(/\n/g, '<br>')}
  </div>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#555;border-bottom:1px solid #e0e0e0;padding-bottom:6px;margin-bottom:12px">
    Ordliste
  </h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
    <tbody>${vocabRows}</tbody>
  </table>

  <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#555;border-bottom:1px solid #e0e0e0;padding-bottom:6px;margin-bottom:12px">
    Øvelser
  </h2>
  <div style="margin-bottom:24px;font-size:14px">${exerciseItems}</div>

  <div style="margin-bottom:28px">
    <a href="${dailyPageUrl}"
       style="display:inline-block;background:#2d6a4f;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:600">
      Hør uttalen og gjør øvelsene →
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px">
  <p style="font-size:12px;color:#999;margin:0;font-family:sans-serif">
    Du mottar dette fordi du abonnerer på Norskeord-leksjoner (${levelLabel}).<br>
    <a href="${unsubUrl}" style="color:#999">Avslutt abonnement</a>
  </p>

</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const serviceKey = secretKeys['default'];
  const resendKey = Deno.env.get('RESEND_API_KEY')!;
  const emailFrom = Deno.env.get('EMAIL_FROM')!;
  const appUrl = Deno.env.get('APP_URL')!;
  const unsubSecret = Deno.env.get('UNSUBSCRIBE_SECRET')!;

  if (!supabaseUrl || !serviceKey || !resendKey || !emailFrom || !appUrl || !unsubSecret) {
    return new Response(JSON.stringify({ error: 'Missing required env vars' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Skip entirely if today is not a send day for either group.
  if (!isSendDay(today)) {
    console.log(`[send-lesson-email] ${todayStr} is not a send day — skipping`);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: 'not a send day', date: todayStr }),
      { status: 200 }
    );
  }

  const results: Record<string, { sent: number; failed: number; noLesson?: boolean }> = {};

  for (const group of ['A', 'B'] as LevelGroup[]) {
    results[group] = { sent: 0, failed: 0 };

    // Fetch today's approved lesson for this group.
    const { data: lesson, error: lessonErr } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('level_group', group)
      .eq('lesson_date', todayStr)
      .eq('approved', true)
      .maybeSingle();

    if (lessonErr || !lesson) {
      console.warn(`[send-lesson-email] No approved lesson for group=${group} date=${todayStr}`);
      results[group].noLesson = true;
      continue;
    }

    // Fetch active subscribers for this level group via the view.
    const levelValues = group === 'A' ? ['A1', 'A2'] : ['B1', 'B2'];
    const { data: subscribers, error: subErr } = await supabase
      .from('email_subscribers_with_email')
      .select('user_id, level, email')
      .eq('active', true)
      .in('level', levelValues);

    if (subErr || !subscribers) {
      console.error(
        `[send-lesson-email] Failed to fetch subscribers for group=${group}:`,
        subErr?.message
      );
      continue;
    }

    console.log(
      `[send-lesson-email] group=${group} lesson=${todayStr} subscribers=${subscribers.length}`
    );

    for (const sub of subscribers as Subscriber[]) {
      const unsubUrl = buildUnsubscribeUrl(sub.user_id, unsubSecret, appUrl);
      const html = buildEmailHtml(lesson as Lesson, sub, appUrl, unsubUrl);

      const { error: sendErr } = await resend.emails.send({
        from: emailFrom,
        to: sub.email,
        subject: `Norsk leksjon: ${lesson.focus_topic}`,
        html
      });

      if (sendErr) {
        console.error(`[send-lesson-email] Failed for user=${sub.user_id}:`, sendErr.message);
        results[group].failed++;
      } else {
        console.log(`[send-lesson-email] Sent to user=${sub.user_id}`);
        results[group].sent++;
      }

      // 50 ms pause — stay within Resend's rate limits.
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  return new Response(JSON.stringify({ ok: true, date: todayStr, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
