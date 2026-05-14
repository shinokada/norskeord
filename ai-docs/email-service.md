# Email Service

This document summarises the decisions made about a weekly email service for Norske Flashcard, complementing the flashcard and audio experience on the website.

---

## Concept

A recurring email service that supplements flashcard study with short, realistic Norwegian texts. Each email teaches one clear language focus — not a dump of rules — and reinforces it through high-frequency vocabulary in natural sentences plus a small number of quick exercises. Every email links back to the website for audio via the existing `SpeakButton` functionality.
Users can only subscribe one level only.

### Each email contains

A1/A2 has the same content, B1/B2 has the same content, C1/C2 has the same content.

1. **Short, realistic text** — 5–10 sentences, the core of every email. Natural, not textbook-stilted.
2. **One language focus** — one grammar point, one pattern, one register shift. Not multiple.
3. **5–8 vocabulary items in context** — natural example sentences, not word lists.
4. **1–3 micro-exercises** — fill-in-the-blank, multiple choice, or similar. Keeps reading active, not passive.
5. **Link to website** — for audio playback via `SpeakButton`.

---

## Send Schedule

Fixed per CEFR level — no user-configurable frequency.

| Level | Days | Emails/week |
| ----- | ---- | ----------- |
| A     | Fri  | 1           |
| B     | Fri  | 1           |
| C     | Fri  | 1           |

---

## Level Changes

User can choose only one level.

Example confirmation copy:

> _You've moved to B1. You'll now receive emails Friday._

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

Day-of-week logic:

```ts
const SEND_DAYS: Record<string, number[]> = {
  A1: [5], // Fri
  A2: [5],
  B1: [5],
  B2: [5],
  C1: [5],
  C2: [5]
};
```

### Content — pre-generated, stored in Supabase

Lessons are generated in advance (using the Claude API) and stored in a `daily_lessons` table. The cron job reads from this table rather than generating on the fly — more reliable, easier to review before sending.

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

-- Pre-generated lesson content
CREATE TABLE daily_lessons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level            text NOT NULL,
  lesson_date      date NOT NULL,
  focus_topic      text NOT NULL,       -- e.g. "past tense with -te"
  main_text        text NOT NULL,       -- the 5–10 sentence story
  vocabulary       jsonb NOT NULL,      -- [{norsk, english, example}]
  exercises        jsonb NOT NULL,      -- [{type, prompt, answer}]
  UNIQUE (level, lesson_date)
);
```

Note: no `frequency` or `unsubscribe_token` columns — frequency is derived from the user's level, and unsubscribe is handled via a signed URL containing the `user_id`.

---

## Micro-exercise delivery

Exercises link to a level-scoped dated page on the site rather than being interactive inside the email itself. Email clients have inconsistent JS support; the website already has audio, auth state, and full interactivity. This also drives return visits.

Should users be access only own level?

**URL structure:** `/daily/[level]/[date]` where `level` is `a`, `b`, or `c` (matching the email group, not the specific CEFR sublevel).

Examples:

- `/daily/a/2026-04-23` — A1/A2 content for that date
- `/daily/b/2026-04-23` — B1/B2 content for that date
- `/daily/c/2026-04-23` — C1/C2 content for that date

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

- `email_subscribers` and `daily_lessons` tables in Supabase
- Edge Function: send email via Resend for a given level + date
- `pg_cron` job: fires each weekday morning, calls Edge Function for applicable levels
- Opt-in toggle in user account settings
- Level-change confirmation screen updated to show new send schedule
- 4–6 weeks of lesson content pre-generated per level before launch
