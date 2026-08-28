/**
 * generate-lessons.ts
 * This is not used any more.
 * Generates upcoming lesson content via Claude API and stores in daily_lessons.
 * Run manually whenever you want to top up the buffer (aim for 6 weeks ahead).
 *
 * Usage:
 *   pnpm generate:lessons
 *
 * Reads from .env automatically via --env-file=.env in the npm script.
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
- main_text: realistic everyday or professional Norwegian, not textbook-stilted`
};

// ── Generation ─────────────────────────────────────────────────────────────────

async function generateLesson(group: LevelGroup, date: Date): Promise<object> {
  const dateStr = date.toISOString().slice(0, 10);
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
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
  const clean = raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
  return JSON.parse(clean);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const groups: LevelGroup[] = ['A', 'B'];
  let generated = 0;
  let skipped = 0;

  for (const group of groups) {
    const dates = getUpcomingSendDates(group, 6);
    console.log(`\nGroup ${group}: ${dates.length} send dates in the next 6 weeks`);

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
