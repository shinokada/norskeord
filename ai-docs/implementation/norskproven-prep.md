# Norskprøven Prep — Implementation Plan

Companion to `monetization-focusd-implementation.md` (Phase 4 growth features).
This document covers the design and implementation of Norskprøven practice tests as a Plus-only feature.

---

## Status

| Phase | Description                                | Status         |
| ----- | ------------------------------------------ | -------------- |
| NP-1  | Data model + JSON content files            | ✅ Done        |
| NP-2  | Reading practice (multiple choice)         | ✅ Done        |
| NP-3  | Writing practice (prompts + model answers) | ✅ Done        |
| NP-4  | Oral practice (prompt cards)               | ✅ Done        |
| NP-5  | `/norskproven/practice` route + Plus gate  | ✅ Done        |
| NP-6  | i18n, nav link, `/plus` page update        | ✅ Done        |
| NP-7  | E2E tests                                  | ⬜ Not started |

---

## Storage decision: JSON files (not database)

Practice questions are stored as **static JSON files**, not in Supabase. Rationale:

- Content changes infrequently — questions are hand-crafted exam prep material, not user-generated
- JSON is consistent with how all vocabulary data is stored (`src/lib/data/vocab-*.json`)
- Content is version-controlled alongside code; changes go through the same review flow
- No additional Supabase tables, RLS policies, or server round-trips needed
- Faster page load — questions are bundled and tree-shaken at build time

**Migration path to DB (when to do it):** Once you have 50+ questions per level and want non-developer contributors to add content without redeploys, move to a `practice_questions` Supabase table and a simple admin editor. That is a later phase. For now, JSON is the right call.

**Image assets:** AI-generated images and SVG diagrams live in `static/norskproven/`. Paths are referenced in JSON. No binary blobs in the database.

---

## Level structure

Follow HKdir's structure at a high level but simplify the bands. HKdir uses overlapping bands (A1-A2, A2-B1, B1-B2) because their adaptive test straddles boundaries. For norskeord, users know their target level. Use clean, non-overlapping levels:

| Level | Who it is for                              |
| ----- | ------------------------------------------ |
| A2    | Users aiming for the A2 Norskprøven result |
| B1    | Users aiming for the B1 Norskprøven result |

B1-B2 content can be added in a later phase for advanced learners.

---

## Test types in scope

| Type      | In scope | Notes                                                      |
| --------- | -------- | ---------------------------------------------------------- |
| Reading   | ✅ Yes   | Multiple choice over a short passage — fully automatable   |
| Writing   | ✅ Yes   | Prompt + model answer reveal — no auto-grading in phase 1  |
| Oral      | ✅ Yes   | Prompt card display only — scenario + discussion questions |
| Listening | ❌ No    | Audio infrastructure out of scope; skip entirely           |

---

## Data model

### TypeScript types — `src/lib/types.ts`

Add to existing types file:

```ts
/** Level for Norskprøven practice: A2 or B1 */
export type NorskprovenLevel = 'A2' | 'B1';

/** Test type */
export type NorskprovenTestType = 'reading' | 'writing' | 'oral';

// ── Reading ──────────────────────────────────────────────────────────────────

export interface ReadingOption {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
}

export interface ReadingQuestion {
  id: string; // e.g. 'rq-001'
  prompt: string; // question text
  options: ReadingOption[];
  correctId: string; // matches one option.id
}

export interface ReadingPassage {
  id: string; // e.g. 'rp-a2-001'
  level: NorskprovenLevel;
  title: string; // passage title shown above the text
  text: string; // the Norwegian passage (1–5 short paragraphs)
  imageUrl?: string; // optional path to static/ asset
  questions: ReadingQuestion[];
}

// ── Writing ──────────────────────────────────────────────────────────────────

export interface WritingPrompt {
  id: string; // e.g. 'wp-a2-001'
  level: NorskprovenLevel;
  situation: string; // context sentence ("You are writing to your landlord...")
  task: string; // the instruction ("Write a message of 60–80 words...")
  wordCountMin: number;
  wordCountMax: number;
  modelAnswer: string; // full example answer (from official PDFs or hand-crafted)
  modelNotes?: string; // optional explanation of what makes this answer good
}

// ── Oral ─────────────────────────────────────────────────────────────────────

export interface OralPrompt {
  id: string; // e.g. 'op-a2-001'
  level: NorskprovenLevel;
  scenario: string; // brief role-play setup or discussion topic
  questions: string[]; // 2–4 discussion questions the examiner may ask
  tips?: string; // preparation tip for the candidate
}

// ── Aggregated ───────────────────────────────────────────────────────────────

export interface NorskprovenData {
  reading: ReadingPassage[];
  writing: WritingPrompt[];
  oral: OralPrompt[];
}
```

### JSON file locations

```
src/lib/data/norskproven-a2.json    — A2 reading passages, writing prompts, oral prompts
src/lib/data/norskproven-b1.json    — B1 reading passages, writing prompts, oral prompts
```

Each file matches the `NorskprovenData` shape:

```json
{
  "reading": [ ... ],
  "writing": [ ... ],
  "oral":    [ ... ]
}
```

### Example A2 reading entry

```json
{
  "id": "rp-a2-001",
  "level": "A2",
  "title": "Legekontoret",
  "text": "Kari skal til legen i dag. Hun har vondt i halsen og feber. Resepsjonisten sier at legen er ledig klokka 14.00. Kari bestiller time og takker for hjelpen.",
  "questions": [
    {
      "id": "rq-a2-001-1",
      "prompt": "Hvorfor skal Kari til legen?",
      "options": [
        { "id": "a", "text": "Hun har vondt i magen." },
        { "id": "b", "text": "Hun har vondt i halsen og feber." },
        { "id": "c", "text": "Hun vil ha en ny resept." },
        { "id": "d", "text": "Hun er gravid." }
      ],
      "correctId": "b"
    }
  ]
}
```

### Example A2 writing entry

```json
{
  "id": "wp-a2-001",
  "level": "A2",
  "situation": "Du bor i en leilighet. Det er et problem med varmen.",
  "task": "Skriv en melding til huseieren din. Fortell om problemet og be om hjelp. Skriv 40–60 ord.",
  "wordCountMin": 40,
  "wordCountMax": 60,
  "modelAnswer": "Hei,\n\nJeg skriver fordi det er et problem med varmen i leiligheten min. Det er veldig kaldt, og varmen virker ikke. Kan du hjelpe meg? Jeg trenger at det blir fikset så snart som mulig.\n\nMed vennlig hilsen,\nKari",
  "modelNotes": "Short, direct. Uses formal greeting and sign-off. States the problem clearly and makes a polite request."
}
```

### Example A2 oral entry

```json
{
  "id": "op-a2-001",
  "level": "A2",
  "scenario": "Du møter en ny nabo. Introduser deg selv og bli kjent med naboen.",
  "questions": [
    "Hva heter du og hvor kommer du fra?",
    "Hvor lenge har du bodd her?",
    "Hva liker du å gjøre på fritiden?"
  ],
  "tips": "Speak in full sentences. You can ask the examiner questions too — this shows communication skills."
}
```

---

## Routes

```
/norskproven/practice                   — landing: choose level + test type
/norskproven/practice/reading/[level]   — reading test session
/norskproven/practice/writing/[level]   — writing prompts
/norskproven/practice/oral/[level]      — oral prompt cards
```

All routes are Plus-only. Free users hitting any `/norskproven/practice/*` URL are redirected to `/plus?ref=norskproven-gate`.

The existing `/norskproven` page stays as-is (public, vocabulary-focused). The practice section is a separate subtree.

---

## Implementation steps

### NP-1: Data files ✅ Done

1. Create `src/lib/data/norskproven-a2.json` and `src/lib/data/norskproven-b1.json` matching the types above.

**Minimum viable content for launch:**

| Level | Reading passages | Writing prompts | Oral prompts |
| ----- | ---------------- | --------------- | ------------ |
| A2    | 5                | 5               | 5            |
| B1    | 5                | 5               | 5            |

**Content sources:**

- Reading: Write original short passages (1–4 sentences) built around exam vocabulary categories (shopping, health, transport, work, housing). Topics must be neutral and realistic — no cultural knowledge required.
- Writing: Adapt from the official `norskprove/writing/eksempelsvar-bokmal-nov17.pdf`. Extract the prompts and write clean model answers.
- Oral: Extract scenarios from the three oral PDFs in `norskprove/oral/`. Each PDF (A1-A2, A2-B1, B1-B2) contains multiple scenarios.

**Image assets:** For phase 1, skip images in reading passages. Add `imageUrl` fields only for passages that genuinely benefit from a visual (e.g. a bus timetable, a form). Create simple SVGs rather than AI-generated images for text-heavy visuals. Store in `static/norskproven/`.

2. Add types to `src/lib/types.ts`.

---

### NP-2: Reading practice ✅ Done

**New file:** `src/routes/norskproven/practice/reading/[level]/+page.svelte`
**Load file:** `src/routes/norskproven/practice/reading/[level]/+page.ts`

**State machine:**

```
idle → [Start] → questioning → [submit answer] → revealing → [Next] → questioning
                                                           → [last question] → summary
```

**Load function:**

```ts
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { NorskprovenData } from '$lib/types';

export const ssr = false;

export const load: PageLoad = async ({ params, parent }) => {
  const { plan } = await parent();
  if (plan !== 'plus') redirect(302, '/plus?ref=norskproven-gate');

  const level = params.level.toUpperCase(); // 'A2' | 'B1'
  if (level !== 'A2' && level !== 'B1') redirect(302, '/norskproven/practice');

  const data: NorskprovenData =
    level === 'A2'
      ? (await import('$lib/data/norskproven-a2.json')).default
      : (await import('$lib/data/norskproven-b1.json')).default;

  return { passages: data.reading, level };
};
```

**Component behaviour:**

- One passage at a time. Show the title and text, then the question(s) below.
- Multiple choice: 4 options, letter labels (A/B/C/D). On selection, highlight correct (green) and wrong-selected (red). Show a brief explanation or just "Riktig!" / "Feil. Riktig svar: B."
- Keyboard shortcuts: `A` / `B` / `C` / `D` to select, `Enter` or `Space` to advance.
- Progress shown as "Tekst 2 av 5" above the passage.
- After all passages: summary showing score (X of Y correct) and a "Try another level" / "Back to practice" link.
- No FSRS integration — this is comprehension practice, not vocabulary recall. No `saveProgress` call.

---

### NP-3: Writing practice ✅ Done

**New file:** `src/routes/norskproven/practice/writing/[level]/+page.svelte`
**Load file:** `src/routes/norskproven/practice/writing/[level]/+page.ts`

Load function mirrors NP-2 but returns `data.writing`.

**Component behaviour:**

- Show one prompt at a time: situation + task instruction + word count guide.
- A `<textarea>` for the user to draft their answer. Show a live word count: "47 / 40–60 ord". Colour red if under min or over max.
- A "Vis eksempelsvar" (Show model answer) button — hidden until the user has typed at least `wordCountMin` words or clicked "I'm done". Reveal the `modelAnswer` and optionally `modelNotes`.
- No auto-grading. The value is in seeing the official style after attempting it yourself.
- Navigation: "Next prompt →" button. After all prompts, show a completion screen.
- Keyboard: `Tab` moves focus between textarea and buttons; no special shortcuts needed.

---

### NP-4: Oral practice ✅ Done

**New file:** `src/routes/norskproven/practice/oral/[level]/+page.svelte`
**Load file:** `src/routes/norskproven/practice/oral/[level]/+page.ts`

Load function returns `data.oral`.

**Component behaviour:**

- Show one scenario card at a time: the scenario description, then the 2–4 discussion questions below it.
- A "Prep" mode (default): read the scenario, think about your answers.
- A "Practice" button reveals the questions one by one (click/tap to reveal each). This simulates the examiner drip-feeding questions.
- An optional countdown timer (2 minutes, matching the real test preparation time). Toggle with a clock icon.
- Tips shown below the card if `tips` is set.
- Navigation: "Next scenario →". After all scenarios, link back to the practice landing.
- No audio recording in phase 1. The value is in rehearsing mentally. A browser-based `MediaRecorder` flow can be added later.

---

### NP-5: Practice landing page ✅ Done

**New file:** `src/routes/norskproven/practice/+page.svelte`
**Load file:** `src/routes/norskproven/practice/+page.ts`

```ts
export const load: PageLoad = async ({ parent }) => {
  const { plan } = await parent();
  if (plan !== 'plus') redirect(302, '/plus?ref=norskproven-gate');
  return {};
};
```

**Layout:** Two columns (A2 / B1), each with three cards:

```
┌─────────────────┐  ┌─────────────────┐
│      A2          │  │      B1          │
│                 │  │                 │
│  📖 Reading     │  │  📖 Reading     │
│  ✍️ Writing     │  │  ✍️ Writing     │
│   🗣️ Oral       │  │  🗣️ Oral       │
└─────────────────┘  └─────────────────┘
```

Each card links to its route. Brief description of what to expect (e.g. "5 short passages, multiple choice").

---

### NP-6: i18n, nav link, plus page update ✅ Done

**i18n keys** — add to `messages/en.json` and `messages/nb.json`:

```json
"norskproven_practice_badge": "Plus",
"norskproven_practice_heading": "Practice tests",
"norskproven_practice_subheading": "Authentic Norskprøven-style tasks for reading, writing, and oral preparation.",
"norskproven_practice_reading": "Reading",
"norskproven_practice_reading_desc": "Short passages with multiple-choice questions",
"norskproven_practice_writing": "Writing",
"norskproven_practice_writing_desc": "Structured prompts with model answers",
"norskproven_practice_oral": "Oral",
"norskproven_practice_oral_desc": "Role-play scenarios and discussion questions",
"norskproven_practice_start": "Start",
"norskproven_practice_passages": "{count} passages",
"norskproven_practice_prompts": "{count} prompts",
"norskproven_practice_scenarios": "{count} scenarios",
"norskproven_reading_text_counter": "Text {current} of {total}",
"norskproven_reading_correct": "Correct!",
"norskproven_reading_incorrect": "Incorrect. Correct answer: {answer}",
"norskproven_reading_next": "Next text",
"norskproven_reading_finish": "Finish",
"norskproven_reading_score": "{correct} of {total} correct",
"norskproven_writing_show_model": "Show model answer",
"norskproven_writing_word_count": "{count} words",
"norskproven_writing_next": "Next prompt",
"norskproven_oral_reveal_question": "Next question",
"norskproven_oral_practice": "Practice",
"norskproven_oral_start_timer": "Start timer (2 min)",
"norskproven_oral_next": "Next scenario"
```

**Nav link:** Add "Practice" under the Norskprøven section for Plus users. Or add a link from the existing `/norskproven` page hero CTA when the user is a Plus member:

In `src/routes/norskproven/+page.svelte`, update the hero CTA:

```svelte
{#if user && plan === 'plus'}
  <a href="/norskproven/practice" class="bg-blue-600 ... ...">
    {m.norskproven_practice_start()}
  </a>
{:else if user}
  <a href="/plus" class="bg-blue-600 ... ...">
    {m.nav_plus_badge()}
  </a>
{:else}
  <a href="/plus" class="bg-blue-600 ... ...">
    {m.nav_plus_badge()}
  </a>
{/if}
```

**Plus page** — add a row to the comparison table and a feature card:

```json
"plus_row_norskproven_practice": "Norskprøven practice tests",
"plus_row_norskproven_practice_free": "—",
"plus_row_norskproven_practice_plus": "Reading, writing & oral",
"plus_feature_norskproven_title": "Exam practice, not just vocabulary",
"plus_feature_norskproven_body": "Reading passages with multiple-choice questions, writing prompts with model answers, and oral role-play scenarios — all at A2 and B1 level."
```

---

### NP-7: E2E tests ✅ Done

**New file:** `e2e/norskproven-practice.test.ts`

| Test                        | What it verifies                                     |
| --------------------------- | ---------------------------------------------------- |
| Gate — free redirect        | `/norskproven/practice` → `/plus` for free users     |
| Gate — Plus access          | Plus user sees the practice landing with A2/B1 cards |
| Reading flow                | Complete one A2 reading passage, see score           |
| Reading correct highlight   | Correct option highlighted green after answering     |
| Reading keyboard            | Press `A` selects first option                       |
| Writing word count          | Live word count updates as user types                |
| Writing model answer hidden | Model answer not visible before user clicks reveal   |
| Writing model answer reveal | Model answer shown after clicking "Vis eksempelsvar" |
| Oral scenario display       | Scenario text and hidden questions visible           |
| Oral question reveal        | Questions revealed one by one on click               |
| Plus page table row         | `/plus` comparison table includes practice tests row |

---

## Images and visuals

For phase 1, only include images when they are genuinely required by the task type (e.g. "click the correct picture" tasks). Rules:

- **Use SVG** for any image with text content (timetables, forms, signs). AI image generators produce unreliable Norwegian text.
- **Use AI-generated images** for simple ambient scenes (a doctor's office, a bus stop, a shop interior) where the image sets context but the text in the image doesn't matter. Store as JPEG or WebP in `static/norskproven/`.
- **Skip images for phase 1** if a passage works without one. Add images in a later content pass.

If AI images are used:

- Generate them via a tool with clear commercial licensing (Midjourney paid plan, Adobe Firefly, DALL-E via OpenAI API).
- Keep a log of prompt + generator in `norskprove/image-log.md` for audit purposes.
- File names must describe the content: `bus-stop-oslo.webp`, not `image-003.webp`.

---

## Files to create

```
src/lib/data/norskproven-a2.json
src/lib/data/norskproven-b1.json
src/routes/norskproven/practice/+page.svelte
src/routes/norskproven/practice/+page.ts
src/routes/norskproven/practice/reading/[level]/+page.svelte
src/routes/norskproven/practice/reading/[level]/+page.ts
src/routes/norskproven/practice/writing/[level]/+page.svelte
src/routes/norskproven/practice/writing/[level]/+page.ts
src/routes/norskproven/practice/oral/[level]/+page.svelte
src/routes/norskproven/practice/oral/[level]/+page.ts
e2e/norskproven-practice.test.ts
static/norskproven/                    (images, created on demand)
norskprove/image-log.md               (if AI images are used)
```

## Files to modify

```
src/lib/types.ts                       (NP-1: add Norskprøven types)
src/routes/norskproven/+page.svelte    (NP-6: update CTA for Plus users)
src/routes/plus/+page.svelte           (NP-6: add practice row + feature card)
messages/en.json                       (NP-6: all new keys)
messages/nb.json                       (NP-6: Norwegian translations)
```

---

## Implementation order and effort

| Step      | Task                                            | Effort  |
| --------- | ----------------------------------------------- | ------- |
| NP-1      | Types + JSON content files (min viable content) | 2–3h    |
| NP-2      | Reading practice route + component              | 2h      |
| NP-3      | Writing practice route + component              | 1.5h    |
| NP-4      | Oral practice route + component                 | 1h      |
| NP-5      | Practice landing page                           | 45min   |
| NP-6      | i18n, nav link, `/plus` page update             | 45min   |
| NP-7      | E2E tests                                       | 45min   |
| **Total** |                                                 | **~9h** |

Content work (extracting from PDFs, writing passages) is the largest variable. The 2–3h estimate for NP-1 assumes you do it yourself; using Claude to generate draft passages and prompts for your review can cut this to under an hour.

---

## Open questions

1. **Writing auto-grading:** Should a Claude API call grade the user's writing attempt before revealing the model answer? This would be a compelling Plus differentiator. Feasible — call the API with the task + user text, return a 2–3 sentence critique. Adds API cost per submission. Defer to a NP-2 phase once the basic flow is live.

2. **Oral recording:** Browser `MediaRecorder` + Claude API audio transcription would let users record themselves and get basic feedback. Significantly more complex. Defer.

3. **Progress tracking:** Should reading quiz scores be stored in Supabase (so users can see "you scored 4/5 on A2 reading, passage 3")? For phase 1, no — results are shown only at session end and not persisted. Add a `practice_results` table later if users want to track improvement over time.

4. **Content volume:** 5 passages/prompts/scenarios per level is MVP. Aim for 10–15 per type per level before the feature is publicly marketed. The JSON-based approach makes adding more content trivial.
