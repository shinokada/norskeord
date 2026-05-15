# Email Service — Implementation Guide

This document translates `ai-docs/email-service.md` into concrete implementation steps.
Work through the steps in order; each step is self-contained and deployable.

---

## Realism Assessment

The design doc is sound and well-scoped. A few notes before diving in:

**What works exactly as described**

- Resend free tier (3,000/month, 100/day) comfortably covers the load. At peak you send to all A1+A2 subscribers + all B1+B2 subscribers on the same day (1st and 3rd Friday). Even at 1,000 total subscribers that is well within limits.
- `pg_cron` + Edge Function is already your proven pattern — `send-push-reminders` uses exactly this architecture. The email sender follows the same shape.
- Claude API generation to a buffer table is reliable. Generating 4 weeks ahead (8 lessons total: 4 send dates × 2 level groups) is trivially cheap.
- The `approved` flag pattern is simple and correct. One boolean gate, no workflow overhead.

**One discrepancy to fix**

The `email-service.md` schema uses `level_group text CHECK (level_group IN ('A','B','C'))` but the existing `subscriptions` table stores `level` as `'A1','A2','B1','B2'` etc. The subscriber table should store the user's specific level (e.g. `'B1'`) and the send function derives the group (`'B'`) at runtime — which the doc already does in the `LEVEL_GROUP` map. Keep it that way; don't store `level_group` on the subscriber.

**The one weak spot: unsubscribe**

The doc mentions "a signed URL with `user_id`" but doesn't specify the signing mechanism. Step 5 below covers a concrete implementation using a HMAC token.

---

## Step 1 — Supabase Schema

Create `supabase/migrations/006_email_service.sql`:

```sql
-- ── email_subscribers ──────────────────────────────────────────────────────────
-- One row per user. Stores the specific CEFR level they subscribed at.
-- Level group (A/B/C) is derived at send time.
CREATE TABLE IF NOT EXISTS email_subscribers (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level          text NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  subscribed_at  timestamptz DEFAULT now(),
  active         boolean DEFAULT true
);

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Users can read and toggle their own subscription.
CREATE POLICY "Users can manage own email subscription"
  ON email_subscribers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── daily_lessons ──────────────────────────────────────────────────────────────
-- AI-generated lesson content. One row per level_group + send_date.
-- A1 and A2 share one row (level_group='A'), B1+B2 share one row (level_group='B').
CREATE TABLE IF NOT EXISTS daily_lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_group   text NOT NULL CHECK (level_group IN ('A','B')),
  lesson_date   date NOT NULL,
  focus_topic   text NOT NULL,       -- e.g. "past tense with -te"
  main_text     text NOT NULL,       -- 5–10 sentence story
  vocabulary    jsonb NOT NULL,      -- [{norsk, english, example}]
  exercises     jsonb NOT NULL,      -- [{type, prompt, options?, answer}]
  approved      boolean NOT NULL DEFAULT false,
  generated_at  timestamptz DEFAULT now(),
  UNIQUE (level_group, lesson_date)
);

ALTER TABLE daily_lessons ENABLE ROW LEVEL SECURITY;

-- Authenticated Plus users can read approved lessons for their level group.
CREATE POLICY "Plus users can read approved lessons"
  ON daily_lessons FOR SELECT
  USING (
    approved = true
    AND auth.uid() IN (
      SELECT user_id FROM subscriptions WHERE plan = 'plus'
    )
  );

-- Service role (used by Edge Functions) bypasses RLS automatically.
```

Run it:

```bash
npx supabase db push
# or apply manually in the Supabase dashboard SQL editor
```

---

## Step 2 — Resend Setup

```bash
pnpm add resend
```

Add to `.env.local` (and to Supabase Edge Function secrets):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Norskeord <lessons@norskeord.com>
```

Verify the `norskeord.com` sending domain in the Resend dashboard (DNS TXT + DKIM records).

---

## Step 3 — Lesson Generation Script

This runs locally (or as an on-demand Edge Function) to top up the buffer.
Create `scripts/generate-lessons.ts`:

```ts
/**
 * generate-lessons.ts
 *
 * Generates upcoming lesson content via Claude API and stores in daily_lessons.
 * Run manually or trigger as a Supabase Edge Function.
 *
 * Usage:
 *   npx tsx scripts/generate-lessons.ts
 *
 * Env vars required:
 *   ANTHROPIC_API_KEY
 *   PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Schedule helpers ───────────────────────────────────────────────────────────

type LevelGroup = 'A' | 'B';

/** Returns true if the given date is a send day for the given level group. */
function isSendDay(group: LevelGroup, date: Date): boolean {
  if (date.getDay() !== 5) return false; // must be Friday
  const fridayIndex = Math.ceil(date.getDate() / 7);
  return fridayIndex === 1 || fridayIndex === 3; // 1st and 3rd Friday only
}

/** Returns all send dates for a group within the next `weeksAhead` weeks. */
function getUpcomingSendDates(group: LevelGroup, weeksAhead = 6): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const limit = new Date(cursor);
  limit.setDate(limit.getDate() + weeksAhead * 7);

  while (cursor < limit) {
    if (isSendDay(group, cursor)) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// ── Prompt templates ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT: Record<LevelGroup, string> = {
  A: `You are a Norwegian language teacher writing email lessons for absolute beginners (A1/A2 CEFR).
Return ONLY valid JSON. No markdown, no preamble.
Schema:
{
  "focus_topic": "string — one grammar point or pattern, e.g. 'present tense -er verbs'",
  "main_text": "string — 5 to 8 natural sentences at A1/A2 level",
  "vocabulary": [
    { "norsk": "string", "english": "string", "example": "string — full sentence" }
  ],
  "exercises": [
    {
      "type": "fill_blank | multiple_choice",
      "prompt": "string — the question or incomplete sentence",
      "options": ["string"] | null,
      "answer": "string"
    }
  ]
}
Rules:
- vocabulary: exactly 5 to 8 items
- exercises: exactly 2 to 3 items
- main_text: no word outside A1/A2 range without glossing it in vocabulary
- No English in main_text except proper nouns`,

  B: `You are a Norwegian language teacher writing email lessons for intermediate learners (B1/B2 CEFR).
Return ONLY valid JSON. No markdown, no preamble.
Schema:
{
  "focus_topic": "string — one grammar point or register feature, e.g. 'passive voice with -s'",
  "main_text": "string — 7 to 10 natural sentences at B1/B2 level",
  "vocabulary": [
    { "norsk": "string", "english": "string", "example": "string — full sentence" }
  ],
  "exercises": [
    {
      "type": "fill_blank | multiple_choice | reorder",
      "prompt": "string",
      "options": ["string"] | null,
      "answer": "string"
    }
  ]
}
Rules:
- vocabulary: exactly 6 to 8 items, choose words that are high-frequency but not trivially basic
- exercises: exactly 2 to 3 items
- main_text: realistic everyday or professional Norwegian, not textbook-stilted`,
};

// ── Generation ─────────────────────────────────────────────────────────────────

async function generateLesson(group: LevelGroup, date: Date): Promise<object> {
  const dateStr = date.toISOString().slice(0, 10);
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT[group],
    messages: [
      {
        role: 'user',
        content: `Generate a Norwegian lesson for ${group === 'A' ? 'A1/A2' : 'B1/B2'} learners. Lesson date: ${dateStr}. Pick a topic not already covered in recent lessons — vary between grammar, vocabulary registers, and everyday phrases.`
      }
    ]
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  // Strip any accidental markdown fences before parsing.
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const groups: LevelGroup[] = ['A', 'B'];
  let generated = 0;
  let skipped = 0;

  for (const group of groups) {
    const dates = getUpcomingSendDates(group, 6);
    for (const date of dates) {
      const lessonDate = date.toISOString().slice(0, 10);

      // Check if a lesson already exists for this slot.
      const { data: existing } = await supabase
        .from('daily_lessons')
        .select('id')
        .eq('level_group', group)
        .eq('lesson_date', lessonDate)
        .single();

      if (existing) {
        console.log(`[skip] ${group} ${lessonDate} — already exists`);
        skipped++;
        continue;
      }

      console.log(`[gen]  ${group} ${lessonDate} — generating…`);
      const lesson = await generateLesson(group, date);

      const { error } = await supabase.from('daily_lessons').insert({
        level_group: group,
        lesson_date: lessonDate,
        approved: false, // requires human review before sending
        ...(lesson as object)
      });

      if (error) {
        console.error(`[err]  ${group} ${lessonDate}:`, error.message);
      } else {
        console.log(`[ok]   ${group} ${lessonDate} — stored`);
        generated++;
      }

      // Brief pause to avoid hitting rate limits.
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}`);
}

main().catch(console.error);
```

Add to `package.json` scripts:

```json
"generate:lessons": "npx tsx scripts/generate-lessons.ts"
```

Run it:

```bash
pnpm generate:lessons
```

---

## Step 4 — Admin Review Page

Create `src/routes/admin/lessons/+page.server.ts`:

```ts
import { createSupabaseServerClient } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies, locals }) => {
  // Guard: only allow admin (hardcode your user_id or check a role flag).
  if (!locals.user) throw redirect(303, '/auth/login');

  const supabase = createSupabaseServerClient(cookies);
  const { data: lessons } = await supabase
    .from('daily_lessons')
    .select('*')
    .order('lesson_date', { ascending: true })
    .order('level_group', { ascending: true });

  return { lessons: lessons ?? [] };
};

export const actions: Actions = {
  approve: async ({ request, cookies }) => {
    const supabase = createSupabaseServerClient(cookies);
    const data = await request.formData();
    const id = data.get('id') as string;
    await supabase.from('daily_lessons').update({ approved: true }).eq('id', id);
  },
  reject: async ({ request, cookies }) => {
    const supabase = createSupabaseServerClient(cookies);
    const data = await request.formData();
    const id = data.get('id') as string;
    await supabase.from('daily_lessons').delete().eq('id', id);
  }
};
```

Create `src/routes/admin/lessons/+page.svelte`:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const groups: Record<string, string> = { A: 'A1/A2', B: 'B1/B2' };
</script>

<h1>Upcoming Lessons</h1>

{#each data.lessons as lesson (lesson.id)}
  <article>
    <header>
      <strong>{lesson.lesson_date}</strong> — Level {groups[lesson.level_group]}
      {#if lesson.approved}
        <span class="badge approved">Approved</span>
      {:else}
        <span class="badge pending">Pending review</span>
      {/if}
    </header>

    <p><em>Focus:</em> {lesson.focus_topic}</p>
    <p>{lesson.main_text}</p>

    <details>
      <summary>Vocabulary ({lesson.vocabulary.length} items)</summary>
      <ul>
        {#each lesson.vocabulary as v}
          <li><strong>{v.norsk}</strong> — {v.english}: <em>{v.example}</em></li>
        {/each}
      </ul>
    </details>

    <details>
      <summary>Exercises ({lesson.exercises.length})</summary>
      {#each lesson.exercises as ex}
        <p>[{ex.type}] {ex.prompt} → <strong>{ex.answer}</strong></p>
      {/each}
    </details>

    {#if !lesson.approved}
      <form method="POST" action="?/approve" style="display:inline">
        <input type="hidden" name="id" value={lesson.id} />
        <button type="submit">✓ Approve</button>
      </form>
      <form method="POST" action="?/reject" style="display:inline">
        <input type="hidden" name="id" value={lesson.id} />
        <button type="submit">✗ Delete</button>
      </form>
    {/if}
  </article>
{/each}
```

This is intentionally minimal — plain HTML, no styling — since it's an internal tool. Add styles to taste.

---

## Step 5 — Unsubscribe Endpoint

Create `src/routes/api/email/unsubscribe/+server.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHmac } from 'crypto';

const SECRET = process.env.UNSUBSCRIBE_SECRET!; // add to .env.local

function verifyToken(userId: string, token: string): boolean {
  const expected = createHmac('sha256', SECRET).update(userId).digest('hex');
  return token === expected;
}

export const GET: RequestHandler = async ({ url }) => {
  const userId = url.searchParams.get('uid');
  const token = url.searchParams.get('token');

  if (!userId || !token || !verifyToken(userId, token)) {
    throw error(400, 'Invalid unsubscribe link');
  }

  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('email_subscribers')
    .update({ active: false })
    .eq('user_id', userId);

  return new Response(
    '<html><body><h2>Unsubscribed</h2><p>You will no longer receive Norwegian lesson emails from Norskeord.</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
};
```

Token generation helper (used in the Edge Function when building emails):

```ts
// src/lib/server/email-token.ts
import { createHmac } from 'crypto';

export function unsubscribeToken(userId: string): string {
  return createHmac('sha256', process.env.UNSUBSCRIBE_SECRET!).update(userId).digest('hex');
}

export function unsubscribeUrl(userId: string, baseUrl: string): string {
  const token = unsubscribeToken(userId);
  return `${baseUrl}/api/email/unsubscribe?uid=${userId}&token=${token}`;
}
```

Add `UNSUBSCRIBE_SECRET` (any random 32-byte hex string) to `.env.local` and to Supabase Edge Function secrets.

---

## Step 6 — Send Email Edge Function

Create `supabase/functions/send-lesson-email/index.ts`:

```ts
/**
 * Edge Function: send-lesson-email
 *
 * Deploy:
 *   npx supabase functions deploy send-lesson-email
 *
 * Schedule via pg_cron (Supabase Dashboard → Database → Cron jobs):
 *   Name:     send-lesson-email
 *   Schedule: 0 8 * * 5          (every Friday at 08:00 UTC)
 *   Command:
 *     SELECT net.http_post(
 *       url := 'https://<project-ref>.supabase.co/functions/v1/send-lesson-email',
 *       headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb
 *     );
 *
 * Required secrets (Supabase Dashboard → Settings → Edge Functions):
 *   RESEND_API_KEY
 *   EMAIL_FROM         e.g. "Norskeord <lessons@norskeord.com>"
 *   APP_URL            e.g. "https://norskeord.com"
 *   UNSUBSCRIBE_SECRET (same value as in .env.local)
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
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
  email: string; // joined from auth.users
}

// ── Schedule helpers ───────────────────────────────────────────────────────────

const LEVEL_GROUP: Record<string, LevelGroup> = {
  A1: 'A', A2: 'A',
  B1: 'B', B2: 'B',
};

function isSendDay(group: LevelGroup, date: Date): boolean {
  if (date.getDay() !== 5) return false;
  const fridayIndex = Math.ceil(date.getDate() / 7);
  return fridayIndex === 1 || fridayIndex === 3;
}

// ── Token helper ───────────────────────────────────────────────────────────────

function unsubscribeUrl(userId: string, secret: string, appUrl: string): string {
  const token = createHmac('sha256', secret).update(userId).digest('hex');
  return `${appUrl}/api/email/unsubscribe?uid=${userId}&token=${token}`;
}

// ── Email template ─────────────────────────────────────────────────────────────

function buildEmailHtml(lesson: Lesson, subscriber: Subscriber, appUrl: string, unsubUrl: string): string {
  const levelLabel = lesson.level_group === 'A' ? 'A1/A2' : 'B1/B2';
  const dailyPageUrl = `${appUrl}/daily/${lesson.level_group.toLowerCase()}/${lesson.lesson_date}`;

  const vocabRows = lesson.vocabulary
    .map(v => `<tr><td><strong>${v.norsk}</strong></td><td>${v.english}</td><td><em>${v.example}</em></td></tr>`)
    .join('');

  const exerciseItems = lesson.exercises
    .map((ex, i) => {
      const opts = ex.options ? `<ul>${ex.options.map(o => `<li>${o}</li>`).join('')}</ul>` : '';
      return `<p><strong>${i + 1}.</strong> ${ex.prompt}${opts}</p>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Norskeord — ${lesson.lesson_date}</title>
  <style>
    body { font-family: Georgia, serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    h1 { font-size: 1.4rem; color: #2d6a4f; }
    h2 { font-size: 1rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
    .meta { color: #666; font-size: 0.85rem; margin-bottom: 24px; }
    .main-text { background: #f9f5f0; border-left: 3px solid #2d6a4f; padding: 12px 16px; border-radius: 0 4px 4px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    .cta { display: inline-block; background: #2d6a4f; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-size: 0.9rem; margin-top: 8px; }
    .footer { font-size: 0.75rem; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>Norskeord — Norsk leksjon</h1>
  <p class="meta">${levelLabel} · ${lesson.lesson_date} · <em>${lesson.focus_topic}</em></p>

  <h2>Tekst</h2>
  <div class="main-text">${lesson.main_text.replace(/\n/g, '<br>')}</div>

  <h2>Ordliste</h2>
  <table>
    <thead><tr><th>Norsk</th><th>Engelsk</th><th>Eksempel</th></tr></thead>
    <tbody>${vocabRows}</tbody>
  </table>

  <h2>Øvelser</h2>
  ${exerciseItems}
  <p>
    <a class="cta" href="${dailyPageUrl}">Hør uttalen og gjør øvelsene →</a>
  </p>

  <div class="footer">
    Du mottar dette fordi du abonnerer på Norskeord-leksjoner (${levelLabel}).<br>
    <a href="${unsubUrl}">Avslutt abonnement</a>
  </div>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendKey = Deno.env.get('RESEND_API_KEY')!;
  const emailFrom = Deno.env.get('EMAIL_FROM')!;
  const appUrl = Deno.env.get('APP_URL')!;
  const unsubSecret = Deno.env.get('UNSUBSCRIBE_SECRET')!;

  const supabase = createClient(supabaseUrl, serviceKey);
  const resend = new Resend(resendKey);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const results: Record<string, { sent: number; skipped: number; failed: number }> = {};

  for (const group of ['A', 'B'] as LevelGroup[]) {
    results[group] = { sent: 0, skipped: 0, failed: 0 };

    // Skip if today is not a send day for this group.
    if (!isSendDay(group, today)) {
      console.log(`[skip] group=${group} — not a send day`);
      results[group].skipped = -1; // sentinel: not applicable today
      continue;
    }

    // Fetch the approved lesson for today.
    const { data: lesson, error: lessonErr } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('level_group', group)
      .eq('lesson_date', todayStr)
      .eq('approved', true)
      .single();

    if (lessonErr || !lesson) {
      console.error(`[err] group=${group} no approved lesson for ${todayStr}`);
      continue;
    }

    // Fetch active subscribers for this level group.
    // We join email from auth.users via a view or RPC — see note below.
    const { data: subscribers, error: subErr } = await supabase
      .from('email_subscribers_with_email') // view defined in schema step below
      .select('user_id, level, email')
      .eq('active', true)
      .in('level', group === 'A' ? ['A1', 'A2'] : ['B1', 'B2']);

    if (subErr || !subscribers) {
      console.error(`[err] group=${group} failed to fetch subscribers:`, subErr?.message);
      continue;
    }

    console.log(`[send] group=${group} lesson=${todayStr} subscribers=${subscribers.length}`);

    for (const sub of subscribers as Subscriber[]) {
      const html = buildEmailHtml(lesson as Lesson, sub, appUrl, unsubscribeUrl(sub.user_id, unsubSecret, appUrl));

      const { error: sendErr } = await resend.emails.send({
        from: emailFrom,
        to: sub.email,
        subject: `Norsk leksjon: ${lesson.focus_topic}`,
        html
      });

      if (sendErr) {
        console.error(`[err] user=${sub.user_id}:`, sendErr.message);
        results[group].failed++;
      } else {
        results[group].sent++;
      }

      // 50 ms pause to stay well within Resend's rate limits.
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  return new Response(JSON.stringify({ ok: true, date: todayStr, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Subscriber email view** — add to the migration SQL (auth.users is not directly queryable via RLS, but the service role can):

```sql
-- View that joins email_subscribers with the user email from auth.users.
-- Only accessible with the service role key (used by Edge Functions).
CREATE VIEW email_subscribers_with_email AS
SELECT
  es.user_id,
  es.level,
  es.active,
  es.subscribed_at,
  au.email
FROM email_subscribers es
JOIN auth.users au ON au.id = es.user_id;
```

---

## Step 7 — pg_cron Schedule

In the Supabase Dashboard → Database → Cron Jobs, add:

| Name | Schedule | Command |
|---|---|---|
| `send-lesson-email` | `0 8 * * 5` | `SELECT net.http_post(url := 'https://<ref>.supabase.co/functions/v1/send-lesson-email', headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb)` |

This fires every Friday at 08:00 UTC. The function itself checks `isSendDay` per group, so A/B emails only go out on the 1st and 3rd Friday. No emails are wasted on off-weeks.

---

## Step 8 — `/daily/[level]/[date]` Exercise Page

Create `src/routes/daily/[level]/[date]/+page.server.ts`:

```ts
import { createSupabaseServerClient } from '$lib/server/supabase';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');

  const { level, date } = params;
  const group = level.toUpperCase() as 'A' | 'B';

  if (!['A', 'B'].includes(group)) throw error(404, 'Not found');

  const supabase = createSupabaseServerClient(cookies);
  const { data: lesson, error: err } = await supabase
    .from('daily_lessons')
    .select('*')
    .eq('level_group', group)
    .eq('lesson_date', date)
    .eq('approved', true)
    .single();

  if (err || !lesson) throw error(404, 'Lesson not found');

  return { lesson };
};
```

Create `src/routes/daily/[level]/[date]/+page.svelte`:

```svelte
<script lang="ts">
  import SpeakButton from '$lib/SpeakButton.svelte';
  import type { PageData } from './$types';
  export let data: PageData;

  const { lesson } = data;
  let answers: Record<number, string> = {};
  let revealed: Record<number, boolean> = {};
</script>

<article>
  <header>
    <h1>{lesson.focus_topic}</h1>
    <p class="meta">{lesson.lesson_date}</p>
  </header>

  <section>
    <h2>Tekst</h2>
    {#each lesson.main_text.split('\n') as sentence}
      <p>
        {sentence}
        <SpeakButton text={sentence} lang="nb-NO" />
      </p>
    {/each}
  </section>

  <section>
    <h2>Ordliste</h2>
    {#each lesson.vocabulary as item}
      <div class="vocab-row">
        <span class="norsk">{item.norsk}</span>
        <span class="english">{item.english}</span>
        <span class="example">
          {item.example}
          <SpeakButton text={item.example} lang="nb-NO" />
        </span>
      </div>
    {/each}
  </section>

  <section>
    <h2>Øvelser</h2>
    {#each lesson.exercises as ex, i}
      <div class="exercise">
        <p>{i + 1}. {ex.prompt}</p>
        {#if ex.type === 'multiple_choice' && ex.options}
          {#each ex.options as opt}
            <label>
              <input type="radio" name="ex-{i}" value={opt} bind:group={answers[i]} />
              {opt}
            </label>
          {/each}
        {:else}
          <input type="text" bind:value={answers[i]} placeholder="Skriv svaret…" />
        {/if}
        <button on:click={() => revealed[i] = true}>Vis svar</button>
        {#if revealed[i]}
          <p class="answer">✓ {ex.answer}</p>
        {/if}
      </div>
    {/each}
  </section>
</article>
```

---

## Step 9 — Profile Page: Subscription Toggle

In `src/routes/profile/+page.svelte` (Phase 4-A), add to the Notifications section:

```svelte
<!-- Email lesson service (Plus only) -->
{#if data.plan === 'plus'}
  <label>
    <input
      type="checkbox"
      checked={emailSubscribed}
      on:change={toggleEmailSubscription}
    />
    Receive Norwegian lesson emails
    {#if emailSubscribed}
      <span class="meta">(biweekly, {levelGroup === 'A' ? 'A1/A2' : 'B1/B2'} level)</span>
    {/if}
  </label>
{/if}
```

Add a server action `toggleEmail` in `src/routes/profile/+page.server.ts`:

```ts
toggleEmail: async ({ request, cookies, locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  const supabase = createSupabaseServerClient(cookies);
  const data = await request.formData();
  const active = data.get('active') === 'true';
  const level = locals.user_level; // from profile or user_settings

  if (active) {
    await supabase.from('email_subscribers').upsert({
      user_id: locals.user.id,
      level,
      active: true
    });
  } else {
    await supabase
      .from('email_subscribers')
      .update({ active: false })
      .eq('user_id', locals.user.id);
  }
}
```

---

## Automation Without Human Review

The design doc recommends human review (the `approved` flag) for the first few months.
Once you trust the generation quality, you can remove the manual gate entirely:

**Option A — Auto-approve on generation**

In `generate-lessons.ts`, change the insert to:

```ts
await supabase.from('daily_lessons').insert({
  // ...
  approved: true   // ← was false
});
```

**Option B — Auto-approve via a Supabase Edge Function**

Create `supabase/functions/auto-approve-lessons/index.ts` that runs weekly (e.g. every Monday at 06:00 UTC via pg_cron):

```ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Auto-approve all lessons that were generated more than 48 hours ago
  // and are scheduled more than 3 days from now (buffer to catch any issues).
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  const { data, error } = await supabase
    .from('daily_lessons')
    .update({ approved: true })
    .eq('approved', false)
    .lt('generated_at', cutoff.toISOString())
    .select('id, level_group, lesson_date');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`[auto-approve] approved ${data?.length ?? 0} lessons`);
  return new Response(JSON.stringify({ ok: true, approved: data?.length ?? 0 }), { status: 200 });
});
```

pg_cron schedule: `0 6 * * 1` (every Monday at 06:00 UTC).

This gives you a 48-hour window after generation to spot-check the `/admin/lessons` page and reject anything bad. Everything else gets approved automatically before the Friday send. No action required on your end in normal operation.

---

## Files Summary

```
scripts/generate-lessons.ts                              ← Step 3 (run locally or on-demand)
supabase/migrations/006_email_service.sql                ← Step 1
supabase/functions/send-lesson-email/index.ts            ← Step 6
supabase/functions/auto-approve-lessons/index.ts         ← Step 9 (optional)
src/lib/server/email-token.ts                            ← Step 5
src/routes/api/email/unsubscribe/+server.ts              ← Step 5
src/routes/admin/lessons/+page.server.ts                 ← Step 4
src/routes/admin/lessons/+page.svelte                    ← Step 4
src/routes/daily/[level]/[date]/+page.server.ts          ← Step 8
src/routes/daily/[level]/[date]/+page.svelte             ← Step 8
```

Env vars to add:
```
RESEND_API_KEY=
EMAIL_FROM=Norskeord <lessons@norskeord.com>
APP_URL=https://norskeord.com
UNSUBSCRIBE_SECRET=<32-byte hex>
ANTHROPIC_API_KEY=  (already exists if used elsewhere)
```

---

## Launch Checklist

- [ ] Migration `006_email_service.sql` applied to production
- [ ] `norskeord.com` sending domain verified in Resend dashboard
- [ ] All env vars set in Supabase Edge Function secrets
- [ ] `pnpm generate:lessons` run to pre-generate 6 weeks of A and B content
- [ ] All generated lessons reviewed at `/admin/lessons`
- [ ] `send-lesson-email` Edge Function deployed and manually triggered with a test subscriber
- [ ] `pg_cron` job scheduled
- [ ] Auto-approve function deployed (optional, after first few months)
- [ ] Email subscription toggle live in Profile page
