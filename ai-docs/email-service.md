# Email Service

This document summarises the decisions made about a email service for Norske Flashcard, complementing the flashcard and audio experience on the website.

---

## Concept

A recurring email service that supplements flashcard study with short, realistic Norwegian texts. Each email teaches one clear language focus — not a dump of rules — and reinforces it through high-frequency vocabulary in natural sentences plus a small number of quick exercises. Every email links back to the website for audio via the existing `SpeakButton` functionality.
Users can only subscribe one level only.

### Each email contains

A1/A2 has the same content, B1/B2 has the same content, C1/C2 has no email service.

1. **Short, realistic text** — 5–10 sentences, the core of every email. Natural, not textbook-stilted.
2. **One language focus** — one grammar point, one pattern, one register shift. Not multiple.
3. **5–8 vocabulary items in context** — natural example sentences, not word lists.
4. **1–3 micro-exercises** — fill-in-the-blank, multiple choice, or similar. Keeps reading active, not passive.
5. **Link to website** — for audio playback via `SpeakButton`.

---

## Send Schedule

Fixed per CEFR level group — no user-configurable frequency.

| Level group | Subscribers | Send days (approx.)       | Emails/month |
| ----------- | ----------- | ------------------------- | ------------ |
| A (A1 = A2) | A1 and A2   | 1st, 3rd Fri of the month | 2            |
| B (B1 = B2) | B1 and B2   | 1st, 3rd Fri of the month | 2            |
| C (C1 = C2) |             | None                      | 0            |

**Why biweekly for A and B?** Lower frequency reduces unsubscribe risk for beginners and intermediates, keeps lesson content manageable to generate in advance, and stays well within Resend's free tier limits.

**Shared content within level groups:** A1 and A2 receive identical emails; B1 and B2 receive identical emails. This halves content-generation work and eliminates the need to maintain per-sublevel lesson tables.

---

## Level Changes

User can choose only one level.

Example confirmation copy:

> _You've moved to B1. You'll now receive emails on the 1st and 3rd Friday of each month._

> _You've moved to C1. You'll now receive emails every Friday._

---

## Tech Stack

### Email sending — Resend

Resend is a developer-first transactional email API. It is not a marketing platform like Mailchimp — just a simple REST endpoint. Free tier: 3,000 emails/month, 100/day. One npm package, one API call.

```
pnpm add resend
```

No Mailchimp, no Mailgun, no Sendgrid needed.

### Scheduling — Supabase `pg_cron` + Edge Functions

Supabase has `pg_cron` built in. A cron job runs each morning, checks which levels are scheduled to receive email that day, picks the right lesson, and calls a Supabase Edge Function that sends via Resend.

Send schedule logic:

```ts
// Level groups: A1/A2 share content, B1/B2 share content, C1/C2 share content.
// A and B send on the 1st and 3rd Friday of the month; C sends every Friday.
type LevelGroup = 'A' | 'B' | 'C';

const LEVEL_GROUP: Record<string, LevelGroup> = {
  A1: 'A',
  A2: 'A',
  B1: 'B',
  B2: 'B',
  C1: 'C',
  C2: 'C'
};

/** Returns true if today is a send day for the given level group. */
function isSendDay(group: LevelGroup, date: Date): boolean {
  if (date.getDay() !== 5) return false; // must be Friday
  if (group === 'C') return true; // C sends every Friday
  // A and B: only 1st and 3rd Friday of the month
  const fridayIndex = Math.ceil(date.getDate() / 7); // 1, 2, 3, 4, or 5
  return fridayIndex === 1 || fridayIndex === 3;
}
```

The `pg_cron` job still runs every Friday morning. It checks `isSendDay` per group before calling the Edge Function, so no emails are sent on off weeks for A/B.

### Content — AI-generated and stored in Supabase

Lessons are generated automatically using the Claude API and stored in a `daily_lessons` table. The cron job reads from this table rather than generating on the fly — more reliable and allows a human review step before sending.

#### AI generation pipeline (fully automated)

A scheduled script (e.g. a Supabase Edge Function triggered weekly or on-demand) calls the Claude API to generate all upcoming lessons:

```ts
// Pseudocode — runs once a week to top up the lesson buffer
async function generateUpcomingLessons() {
  const upcomingDates = getUpcomingSendDates({ weeksAhead: 4 }); // returns per group
  for (const { group, date } of upcomingDates) {
    const alreadyExists = await db.dailyLessons.find({ level_group: group, lesson_date: date });
    if (alreadyExists) continue;

    const lesson = await callClaudeAPI({
      system: LESSON_SYSTEM_PROMPT[group],
      user: `Generate a lesson for ${group} learners for ${date}.`
    });
    await db.dailyLessons.insert({ level_group: group, lesson_date: date, ...lesson });
  }
}
```

The system prompt instructs Claude to return structured JSON (text, vocabulary, exercises). No manual writing needed — the pipeline keeps a 4-week buffer ahead of send dates.

**Optional review step:** A simple admin page (`/admin/lessons`) lists upcoming lessons with an approve/reject toggle. Only approved lessons are sent. This is optional but recommended for the first few months.

### Email templates

Plain HTML with inline CSS (email clients don't support external stylesheets). Optionally use `mjml` or `react-email` for a polished layout.

---

## Supabase Schema Additions

```sql
-- Subscriber preferences (one row per user)
CREATE TABLE email_subscribers (
  user_id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level            text NOT NULL CHECK (level IN ('A1','A2','B1','B2','C1','C2')),
  subscribed_at    timestamptz DEFAULT now(),
  active           boolean DEFAULT true
);

-- AI-generated lesson content (one row per level group + send date)
CREATE TABLE daily_lessons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_group      text NOT NULL CHECK (level_group IN ('A','B','C')),
  lesson_date      date NOT NULL,
  focus_topic      text NOT NULL,       -- e.g. "past tense with -te"
  main_text        text NOT NULL,       -- the 5–10 sentence story
  vocabulary       jsonb NOT NULL,      -- [{norsk, english, example}]
  exercises        jsonb NOT NULL,      -- [{type, prompt, answer}]
  approved         boolean DEFAULT false, -- optional human review gate
  generated_at     timestamptz DEFAULT now(),
  UNIQUE (level_group, lesson_date)
);
```

Key design decisions:

- `level_group` (`A`/`B`/`C`) replaces per-sublevel `level` — A1 and A2 share one row, B1 and B2 share one row. This halves the content table size and generation work.
- `approved` flag supports the optional human review step before sending.
- No `frequency` or `unsubscribe_token` columns — frequency is derived from `level_group` at send time, and unsubscribe uses a signed URL with `user_id`.

---

## Micro-exercise delivery

Exercises link to a level-scoped dated page on the site rather than being interactive inside the email itself. Email clients have inconsistent JS support; the website already has audio, auth state, and full interactivity. This also drives return visits.

Should users be access only own level?

**URL structure:** `/daily/[level]/[date]` where `level` is `a`, `b`, or `c` (matching the level group, not the specific CEFR sublevel). A1 and A2 subscribers both receive links to `/daily/a/[date]`; B1 and B2 to `/daily/b/[date]`.

Examples:

- `/daily/a/2026-04-23` — A1/A2 content for that date
- `/daily/b/2026-04-23` — B1/B2 content for that date

**Why level-scoped and not a single `/daily/2026-04-23`:**

- Content is fundamentally different per level group — different text, vocabulary, and exercises
- The URL is self-contained: it always shows the correct content regardless of the user's current level
- Handles edge cases cleanly — forwarded emails, level changes, and old links all resolve correctly
- No ambiguity about which section to display; no dependency on the user's current account state

**SvelteKit route:** `src/routes/daily/[level]/[date]/+page.svelte` — one file, two params.

---

## Implementation Phase

This feature is **Phase 5** — after monetization (Phase 3) and growth features (Phase 4) are in place. It is a retention and engagement tool for paying Pro users, not a standalone product.

Minimum viable scope for first launch:

- `email_subscribers` and `daily_lessons` tables in Supabase (with `level_group` schema)
- Claude API generation script: auto-generates lessons 4 weeks ahead, one row per level group per send date
- Edge Function: send email via Resend for a given level group + date (A1 and A2 get the same send, B1 and B2 get the same send)
- `pg_cron` job: fires every Friday morning, checks `isSendDay` per group, calls Edge Function for applicable groups only
- Opt-in toggle in user account settings
- Level-change confirmation screen updated to reflect biweekly schedule for A/B and weekly for C
- 4–6 weeks of lesson content pre-generated per level group before launch (6 rows total per month vs. 12 previously)
