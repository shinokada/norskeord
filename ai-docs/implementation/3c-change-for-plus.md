# Phase 3-C: Content Gating Strategy — Categories & Phrases

## Status: ⬜ Not started

Companion to `3b-lemonsqueezy-plan.md` (payment wiring) and `monetization-focusd-plan.md` (strategy).
This document defines **what content is gated**, **why**, and **how to implement it**.

---

## Strategic principle

The original plan in `monetization-focusd-plan.md` stated: "Why a feature gate, not a content gate: gating vocabulary categories loses users before they are hooked."

That remains true for A1 and A2. However, a **level-based content gate** for B1+ and a **full gate on all uttrykk (phrases)** is consistent with that principle and adds meaningful Plus value, because:

- Free users get a genuinely complete A1+A2 foundation (42 categories, ~1,000 words) — not a crippled experience
- The gate lands at exactly the moment the user is invested and wants to go deeper
- Phrases are a distinct content type that is hard to find elsewhere in curated form; this is real perceived value, not arbitrary restriction
- Locking half of A1/A2 at random would create frustration before trust is established — this approach avoids that entirely

---

## Recommended tier split

### Vocabulary categories

| Level  | Free    | Plus-only | Rationale                                                                     |
| ------ | ------- | --------- | ----------------------------------------------------------------------------- |
| **A1** | All 20  | —         | Complete A1 must be free. The hook for new users.                             |
| **A2** | All 22  | —         | A2 is the Norskprøven floor. Gating here undermines the core marketing angle. |
| **B1** | 10 core | 22        | Tease with the most exam-relevant categories; gate the rest. See list below.  |
| **B2** | 4 intro | 28        | A small taste shows there is more. See list below.                            |
| **C1** | 0       | All 15    | Premium reward for serious learners.                                          |
| **C2** | 0       | All 12    | Premium reward for serious learners.                                          |

**Free A1 categories (all 20):**
`greetings`, `numbers`, `colors`, `family`, `body`, `food`, `animals`, `home`, `days-months`, `classroom`, `basic-adjectives`, `basic-verbs`, `pronouns-and-questions`, `feelings`, `weather`, `transportation`, `household-items`, `basic-places`, `basic-clothes`, `simple-actions`

**Free A2 categories (all 22):**
`shopping`, `transport`, `clothing`, `hobbies`, `directions`, `occupations`, `sports`, `health-basic`, `weather`, `time`, `descriptive-adjectives`, `cooking`, `nature`, `house-chores`, `communication`, `health-body-intermediate`, `finance-banking`, `body-health-expanded`, `social-life`, `technology-basic`, `environment-basic`, `money-numbers`

**Free B1 categories (10 — Norskprøven core):**
`travel`, `work`, `education`, `health-body-intermediate`, `relationships`, `culture`, `environment`, `media`, `technology`, `norwegian-society`

These 10 map directly to the Norskprøven test topic areas. A free user who came specifically for exam prep gets exactly what they need — and then sees the gate when they want to go broader.

**Plus-only B1 categories (22):**
`city-life`, `traditions`, `opinion-adjectives`, `food-cooking-advanced`, `housing-renting`, `finance-banking`, `dreams-ambitions`, `opinions-arguments`, `communication-skills`, `housing-urban-life`, `mental-wellbeing`, `sports-fitness`, `arts-culture`, `economics-personal-finance`, `environment-b1`, `science-nature`, `media-journalism-b1`, `workplace`, `relationships-family`, `politics-civics`, `language-learning`, `health-system`

**Free B2 categories (4 — intro taste):**
`politics`, `economics`, `social-issues`, `science`

These are the most approachable, topic-adjacent to what a strong B1 learner already knows. Enough to demonstrate what B2 feels like.

**Plus-only B2 categories (28):**
`arts`, `emotions`, `idioms`, `history`, `law`, `literature`, `advanced-adjectives`, `philosophy`, `medicine`, `psychology`, `business`, `religion`, `environment`, `technology`, `media`, `education`, `language`, `argumentation`, `abstract-nouns`, `advanced-verbs`, `geography`, `culture`, `global-issues`, `academic-language`, `discourse-markers`, `work-career`, `relationships`, `communication`

---

### Uttrykk (phrases) — all levels

**All uttrykk are Plus-only**, with one exception described below.

Rationale: phrases are a distinct, high-value content type. Individual vocabulary words are findable in a dictionary. Curated, exam-relevant idiomatic expressions and collocations are genuinely hard to find gathered in one place at the right CEFR level. This makes uttrykk a strong second axis for the Plus upgrade pitch:

> "Unlock deeper levels (B1+) and the full phrase library at every level"

Two reasons to upgrade instead of one.

**Exception: 20 free preview phrases from B2 uttrykk**

To make the value tangible before asking for payment, expose 20 sample phrases from `b2-uttrykk.md` on a free `/uttrykk/b2` page (or as part of the home deck picker), displayed alongside a lock icon and counter for the rest:

> "Showing 20 of 310 phrases — unlock the full collection with Plus →"

Recommended preview selection — pick expressions that are common, short, and immediately useful in writing or speech:

1. å sette pris på
2. å ta noe for gitt
3. rett og slett
4. i tillegg til
5. med tanke på
6. som regel
7. med andre ord
8. i utgangspunktet
9. fremfor alt
10. i større grad
11. uavhengig av
12. å legge vekt på
13. å være opptatt av
14. å ta på alvor
15. å bidra til
16. i forbindelse med
17. i motsetning til
18. å gjøre en forskjell
19. Det er ingen tvil om
20. på vegne av

These are high-frequency academic and formal collocations that appear often in Norskprøven written tasks. Showing exactly these 20 gives a free user immediate practical value and a clear sense of what the full collection contains.

---

## Data structure for Plus gating

The cleanest approach is a `PLUS_CATEGORIES` set in `src/lib/types.ts`, rather than removing categories from `CATEGORIES_BY_LEVEL`. This way the home page can show all categories with a 🔒 badge — **showing locked content converts better than hiding it**, because users see what they are missing.

### Changes to `src/lib/types.ts`

Add after `CATEGORIES_BY_LEVEL`:

```ts
/**
 * Categories that require a Plus subscription.
 * Free users can see these in the picker but cannot open them.
 * A1 and A2 are always fully free — not listed here.
 */
export const PLUS_CATEGORIES = new Set<string>([
  // B1 — plus-only (22)
  'b1/city-life',
  'b1/traditions',
  'b1/opinion-adjectives',
  'b1/food-cooking-advanced',
  'b1/housing-renting',
  'b1/finance-banking',
  'b1/dreams-ambitions',
  'b1/opinions-arguments',
  'b1/communication-skills',
  'b1/housing-urban-life',
  'b1/mental-wellbeing',
  'b1/sports-fitness',
  'b1/arts-culture',
  'b1/economics-personal-finance',
  'b1/environment-b1',
  'b1/science-nature',
  'b1/media-journalism-b1',
  'b1/workplace',
  'b1/relationships-family',
  'b1/politics-civics',
  'b1/language-learning',
  'b1/health-system',
  // B2 — plus-only (28)
  'b2/arts',
  'b2/emotions',
  'b2/idioms',
  'b2/history',
  'b2/law',
  'b2/literature',
  'b2/advanced-adjectives',
  'b2/philosophy',
  'b2/medicine',
  'b2/psychology',
  'b2/business',
  'b2/religion',
  'b2/environment',
  'b2/technology',
  'b2/media',
  'b2/education',
  'b2/language',
  'b2/argumentation',
  'b2/abstract-nouns',
  'b2/advanced-verbs',
  'b2/geography',
  'b2/culture',
  'b2/global-issues',
  'b2/academic-language',
  'b2/discourse-markers',
  'b2/work-career',
  'b2/relationships',
  'b2/communication',
  // C1 — all plus
  'c1/philosophy',
  'c1/academic',
  'c1/formal-writing',
  'c1/rhetoric',
  'c1/complex-emotions',
  'c1/professional',
  'c1/abstract-concepts',
  'c1/politics-democracy',
  'c1/linguistics',
  'c1/media-journalism',
  'c1/architecture-design',
  'c1/diplomacy-international',
  'c1/finance-economics',
  'c1/medicine-healthcare',
  'c1/psychology-advanced',
  // C2 — all plus
  'c2/literary',
  'c2/archaic',
  'c2/proverbs',
  'c2/highly-formal',
  'c2/technical',
  'c2/nuanced-distinctions',
  'c2/advanced-law-justice',
  'c2/neuroscience-cognition',
  'c2/climate-environment-policy',
  'c2/sociology-anthropology',
  'c2/advanced-business-strategy',
  'c2/existential-abstract'
]);

export function isPlusCategory(level: string, category: string): boolean {
  return PLUS_CATEGORIES.has(`${level.toLowerCase()}/${category}`);
}
```

---

## Implementation plan

### Step 1 — `src/lib/types.ts`

Add `PLUS_CATEGORIES` set and `isPlusCategory()` helper as shown above. No other files change in this step.

**Effort:** ~15 min

---

### Step 2 — Home page deck picker (`src/routes/+page.svelte`)

For each category badge in the picker, check `isPlusCategory(level.id, cat)`.

If the user does **not** have Plus:

- Render the badge with a 🔒 prefix and reduced opacity (`opacity-60`)
- Change `href` to `/plus?ref=category-lock` instead of the flashcard route
- Add `title="Plus members only"` for accessibility

```svelte
{#each categories as cat (cat)}
  {@const locked = !isPlus && isPlusCategory(level.id, cat)}
  <a
    href={locked ? '/plus?ref=category-lock' : `/${level.id.toLowerCase()}/${cat}`}
    class="{badge} rounded-full px-4 py-0.5 font-medium transition-opacity hover:opacity-75
           {locked ? 'cursor-default opacity-60' : ''}"
    title={locked ? m.plus_category_locked() : undefined}
  >
    {locked ? '🔒 ' : ''}{getCategoryName(level.id, cat)}
  </a>
{/each}
```

`isPlus` comes from `$page.data.plan === 'plus'` (already threaded through layout).

**Effort:** ~30 min

---

### Step 3 — Flashcard route guard (`src/routes/[level]/[category]/+page.ts`)

Even with the UI lock, enforce the gate server-side so direct URL access is also blocked.

In `src/routes/[level]/[category]/+page.ts` (or add a `+page.server.ts` if it doesn't exist):

```ts
import { redirect } from '@sveltejs/kit';
import { isPlusCategory } from '$lib/types';

export const load = ({ params, parent }) => {
  const { plan } = await parent();
  if (plan !== 'plus' && isPlusCategory(params.level, params.category)) {
    redirect(302, '/plus?ref=category-lock');
  }
};
```

**Effort:** ~20 min

---

### Step 4 — Uttrykk data files

Create phrase JSON files as each level is ready. Suggested structure matching `VocabEntry` where possible:

```json
[
  {
    "norsk": "å sette pris på",
    "english": "to appreciate",
    "example": "Jeg setter virkelig pris på hjelpen din.",
    "example_english": "I really appreciate your help.",
    "level": "B2",
    "category": "uttrykk",
    "part": "phrase"
  }
]
```

File naming convention:

```
src/lib/data/uttrykk-b2.json    ← convert b2-uttrykk.md to this format
src/lib/data/uttrykk-b1.json    ← future
src/lib/data/uttrykk-a2.json    ← future
src/lib/data/uttrykk-a1.json    ← future
```

Add `uttrykk` to the `CATEGORIES_BY_LEVEL` entries for each level once the JSON files exist. All uttrykk entries in `PLUS_CATEGORIES` except for the 20 free B2 preview entries (handled separately — see Step 5).

**Effort:** ~1h per level (JSON conversion + cleanup + deduplication — `b2-uttrykk.md` has some duplicates)

---

### Step 5 — Free B2 uttrykk preview

Rather than a separate route, the 20 free phrases live as a special `uttrykk-preview` category that is NOT in `PLUS_CATEGORIES`. This means it appears in the picker as a normal free category, with a note in the UI: "20 of 310 phrases — full collection with Plus →".

Add to `CATEGORIES_BY_LEVEL.B2`:

```ts
B2: [
  // ... existing categories ...
  'uttrykk-preview' // free — 20 sample phrases
];
```

Create `src/lib/data/uttrykk-b2-preview.json` with exactly the 20 phrases listed in this document. The full `uttrykk-b2.json` is Plus-only.

On the flashcard page for this category, add a small banner below the card counter:

> "You're previewing 20 phrases from the B2 collection. [Unlock all 310 →](/plus)"

**Effort:** ~1h

---

### Step 6 — i18n keys - DONE

Add to `messages/en.json`:

```json
"plus_category_locked": "Plus members only",
"plus_uttrykk_preview_banner": "Previewing {count} phrases from the B2 collection.",
"plus_uttrykk_preview_cta": "Unlock all {total} →",
"home_uttrykk_preview_label": "Phrases (preview)"
```

Add corresponding keys to `messages/nb.json`:

```json
"plus_category_locked": "Kun for Plus-medlemmer",
"plus_uttrykk_preview_banner": "Du ser {count} fraser fra B2-samlingen.",
"plus_uttrykk_preview_cta": "Lås opp alle {total} →",
"home_uttrykk_preview_label": "Fraser (forhåndsvisning)"
```

**Effort:** ~15 min

---

### Step 7 /plus page update

- Update /plus page using more concise language.
- Update Free vs Plus table.
- Simplify or remove "How smart review works".

## Files to create

```
src/lib/data/uttrykk-b2-preview.json    — 20 free sample phrases
src/lib/data/uttrykk-b2.json                  — full B2 phrase collection (Plus-only)
src/lib/data/uttrykk-b1.json                  — future
src/lib/data/uttrykk-a2.json                  — future
src/lib/data/uttrykk-a1.json                  — future
```

## Files to modify

```
src/lib/types.ts                              — add PLUS_CATEGORIES + isPlusCategory()
src/routes/+page.svelte                       — lock badges for Plus categories
src/routes/[level]/[category]/+page.ts        — server-side guard
src/lib/VocabFlashcardPage.svelte             — uttrykk preview banner
messages/en.json                              — new i18n keys
messages/nb.json                              — Norwegian translations
```

---

## Implementation order summary

| Step | Task                                                        | Effort  |
| ---- | ----------------------------------------------------------- | ------- |
| 1    | Add `PLUS_CATEGORIES` and `isPlusCategory()` to `types.ts`  | 15 min  |
| 2    | Lock category badges on home page                           | 30 min  |
| 3    | Server-side route guard                                     | 20 min  |
| 4    | Convert `b2-uttrykk.md` → `uttrykk-b2.json` (Plus-only)     | 1h      |
| 5    | Create `uttrykk-b2-preview.json` (20 free phrases) + banner | 1h      |
| 6    | i18n keys (en + nb)                                         | 15 min  |
| —    | Future: uttrykk JSON files for B1, A2, A1                   | ongoing |

**Total for vocabulary gating + B2 preview:** ~3.5h

Steps 1–3 can be done immediately since no new data files are needed — the category lists are already defined in `CATEGORIES_BY_LEVEL`. Steps 4–6 depend on the uttrykk JSON conversion.

---

## Open decisions

1. **Show locked badges or hide them?** This document assumes show (🔒 badge + redirect to `/plus`). If you prefer hiding, remove locked items from the picker loop — but showing is generally better for conversion.
2. **B2 free count: 4 or more?** The 4 free B2 vocabulary categories (`politics`, `economics`, `social-issues`, `science`) can be adjusted. 4 is a meaningful taste without giving away the level.
3. **Uttrykk route structure:** This document proposes `uttrykk` as a category inside the existing `[level]/[category]` route. An alternative is a dedicated `/uttrykk/[level]` route if phrases need different flashcard behaviour (e.g. no TTS, different card layout). Decide before Step 4.
4. **Deduplication in `b2-uttrykk.md`:** The file has duplicate entries (e.g. `å sette pris på`, `å ende opp med`, `å bidra til`, `å benytte seg av`, `å satse på`, `å regne med`). Deduplicate during the JSON conversion in Step 4.
5. **Future uttrykk levels:** A1/A2/B1 uttrykk files are marked future in this plan. Prioritise B1 uttrykk after B2 is live — B1 is the highest-traffic level for Norskprøven candidates.
