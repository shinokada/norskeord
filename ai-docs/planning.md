# Planning

## Goal

Build a Norwegian flashcard app organised by CEFR learner level (A1 → C2).
Each vocabulary entry is AI-generated and stored as JSON.

---

## VocabEntry structure

```json
{
	"norsk": "en flyplassen",
	"english": "the airport",
	"example": "Vi møttes på flyplassen tidlig om morgenen.",
	"example_english": "We met at the airport early in the morning.",
	"level": "B1",
	"category": "travel",
	"part": "noun"
}
```

### Field rules

- `norsk` — Norwegian word. Nouns include article (`en`, `ei`, `et`). Verbs include infinitive marker (`å`).
- `english` — English translation.
- `example` — A natural Norwegian sentence using only vocabulary appropriate to the stated level.
- `example_english` — _(optional)_ English translation of the example sentence. Recommended for A1/A2; optional for B1+. Show on demand in the UI as a toggle.
- `level` — CEFR level: `A1` | `A2` | `B1` | `B2` | `C1` | `C2`
- `category` — Topic slug (see categories by level below).
- `part` — Part of speech: `noun` | `verb` | `adjective` | `adverb` | `pronoun` | `preposition` | `conjunction` | `interjection` | `phrase`

---

## Categories by level

```
A1: greetings, numbers, colors, family, body, food, animals, home, days-months, classroom
A2: shopping, transport, clothing, hobbies, directions, occupations, sports, health-basic, weather, time
B1: travel, environment, media, culture, technology, relationships, education, work, city-life, traditions
B2: politics, economics, social-issues, arts, science, emotions, idioms, history, law, literature
C1: philosophy, academic, formal-writing, rhetoric, complex-emotions, professional, abstract-concepts
C2: literary, archaic, proverbs, highly-formal, technical, nuanced-distinctions
```

---

## Target cards per category

| Level | Cards per category |
| ----- | ------------------ |
| A1    | 30–40              |
| A2    | 40–50              |
| B1    | 50–70              |
| B2    | 60–80              |
| C1    | 40–60              |
| C2    | 40–60              |

Generate in batches of 50. For a second batch, add: _"Avoid these words: [paste existing norsk values]"_ to prevent duplicates.

---

## AI prompt template

> Generate **50** Norwegian vocabulary words at CEFR **{LEVEL}** level in the category **"{CATEGORY}"**.
> Return a JSON array where each object has exactly these fields:
>
> - `norsk` — the Norwegian word (nouns include article: `en`/`ei`/`et`, verbs include `å`)
> - `english` — the English translation
> - `example` — a natural Norwegian sentence using only {LEVEL}-level language
> - `example_english` — English translation of the example sentence
> - `level` — `"{LEVEL}"`
> - `category` — `"{CATEGORY}"`
> - `part` — one of: `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `interjection`, `phrase`
>
> Return only valid JSON with no explanation.

Replace `{LEVEL}` and `{CATEGORY}` before sending.

---

## Data file structure

One JSON file per level. Each file contains all categories for that level.

```
src/lib/data/
  vocab-a1.json   ← all A1 categories (greetings, numbers, family, ...)
  vocab-a2.json   ← all A2 categories (shopping, transport, clothing, ...)
  vocab-b1.json   ← all B1 categories (travel, work, technology, ...)
  vocab-b2.json   ← all B2 categories (politics, emotions, idioms, ...)
  vocab-c1.json   ← all C1 categories (philosophy, academic, ...)
  vocab-c2.json   ← all C2 categories (literary, archaic, ...)
```

**Why not one big file?** SvelteKit loads only the file needed for the current route — splitting by level keeps page bundles small.

**Why not one file per category?** ~40+ files becomes hard to manage. Filtering by category at runtime within a level file is fast and simple.

Each level route imports only its file:

```ts
// src/routes/b1/+page.ts
import vocab from '$lib/data/vocab-b1.json';
```

---

## Navigation structure

Three mega menu items — **Nivå A**, **Nivå B**, **Nivå C** — each opens a full-width dropdown with two columns showing sub-levels and their category links.

```
[ Nivå A ▾ ]      [ Nivå B ▾ ]      [ Nivå C ▾ ]    About
┌──────────────────────────────────────────────────────────────┐
│  A1                     │  A2                                │
│  • Greetings            │  • Shopping                        │
│  • Numbers              │  • Transport                       │
│  • ...                  │  • ...                             │
└──────────────────────────────────────────────────────────────┘
```

**Implementation:**

- `MegaMenu full` from flowbite-svelte with `items={[]}` and `extra` snippet
- Categories driven from `CATEGORIES_BY_LEVEL` in `src/lib/types.ts` — no hardcoded links in the nav
- Routes: `/a1/greetings`, `/b1/travel`, `/c2/proverbs`, etc.
- Trigger: each `NavLi` activates the following `MegaMenu` via click (Popper `previousElementSibling`)

**Route files:**

```
src/routes/[level]/[category]/
  +page.ts      ← loads vocab-{level}.json, filters by category
  +page.svelte  ← renders FlashcardPage or empty state
```

Legacy routes (`/`, `/level-a2`, `/verbs`, `/adjectives`, `/vocab`, `/education`, `/sayings`) remain accessible at their original URLs but are no longer in the nav.

---

## TypeScript types (src/lib/types.ts)

```ts
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CATEGORIES_BY_LEVEL = { A1: [...], A2: [...], ... } as const;

export type Category = (typeof CATEGORIES_BY_LEVEL)[CEFRLevel][number];

export interface VocabEntry {
  norsk: string;
  english: string;
  example: string;
  level: CEFRLevel;
  category: Category;
  part: PartOfSpeech;
}
```
