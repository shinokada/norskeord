# Adding definition to flashcard

## Inspiration

```
**Graduate to Monolingual Clues:** As an A2 learner approaching B1, the goal is to stop using English prompts entirely. If you use custom flashcard apps (like Anki), try making cards where the front is a simple Norwegian explanation, and the back is the Norwegian word/phrase you want to use.
```

## Goals

All the vocab-b1, b2, c1, c2.json files are updated already.

1. my-profile Preferences Card direction:
   When the Card type is Word, then
   - definition → norsk and english → norsk and norsk → english for B1/B2/C1/C2
   - Norwegian → English and English → Norwegian for A1/A2

Add a note that this is for level B1/B2/C1/C2.
When the Card type is Phrase, then keep the current.

2. Flashcard page: Change English/Norsk button in Flashcard to a button to cycle Definition/English/Norsk when Word/Phrase button is Word. And when you select Definition, Word/Phrase button should change to Word.

---

## Implementation Plan

### Overview

The `definition` field already exists on `VocabEntry` in `src/lib/types.ts` and is populated in the B1–C2 JSON files. The work is split into two areas: (1) the **PreferencesSection** in my-profile, and (2) the **VocabFlashcardPage** component.

---

### Part 1 — PreferencesSection: Card Direction

**File:** `src/routes/my-profile/PreferencesSection.svelte`

The current `card_direction` field on `Profile` uses `'no_en' | 'en_no'`. We need to add a third value `'def_no'` for Definition → Norwegian.

#### 1a. Extend the Profile type

In `src/lib/server/profile.ts`, change:

```ts
card_direction: 'no_en' | 'en_no';
```

to:

```ts
card_direction: 'no_en' | 'en_no' | 'def_no';
```

Also update `ProfileUpdate` accordingly.

#### 1b. Add `def_no` to the card direction options — but only when Card type is Word

In `PreferencesSection.svelte`, the card direction radio group currently shows two options. Change the options array to be derived from `cardType` and the user's `targetLevel`:

- If `cardType === 'word'` **and** `targetLevel` is `B1 / B2 / C1 / C2`: show three options — `no_en` (Norwegian → English), `en_no` (English → Norwegian), `def_no` (Definition → Norwegian).
- If `cardType === 'word'` **and** `targetLevel` is `A1 / A2`: show only the original two options — `no_en`, `en_no`.
- If `cardType === 'phrase'`: show only `no_en` and `en_no` (unchanged).

Add a note below the card-direction radio group (visible only when B1+ is selected and card type is Word):

> _"Definition mode is available for B1 and above, where monolingual Norwegian definitions have been added to all words."_

Use the i18n key `profile_prefs_card_direction_def_note` for this string.

#### 1c. Add the new i18n strings

In `messages/en.json` add:

```json
"profile_prefs_card_direction_def_no": "Definition → Norwegian",
"profile_prefs_card_direction_def_note": "Definition mode is available for B1 and above, where every word has a monolingual Norwegian clue."
```

In `messages/nb.json` add the Norwegian equivalents.

#### 1d. Persist to localStorage

In `applyToLocalStorage()`, update the mode mapping:

```ts
const modeMap = { no_en: 'noreng', en_no: 'engnor', def_no: 'defnor' };
localStorage.setItem('vocab-flashcard-mode', modeMap[cardDirection]);
```

#### 1e. Supabase migration

Run `supabase/migrations/009_card_direction_def_no.sql` before deploying:

```sql
-- Migration 009: Add 'def_no' to profiles.card_direction check constraint
-- Run in Supabase SQL editor before deploying definition-mode code.

alter table public.profiles
  drop constraint if exists profiles_card_direction_check;

alter table public.profiles
  add constraint profiles_card_direction_check
  check (card_direction in ('no_en', 'en_no', 'def_no'));
```

> **Note:** The existing constraint name is `profiles_card_direction_check` (Postgres auto-names it from table + column + "check"). The migration drops it first to be safe, then re-adds it with the expanded set of values. Any existing rows with `'no_en'` or `'en_no'` are unaffected.

---

### Part 2 — VocabFlashcardPage: Cycle Button

**File:** `src/lib/VocabFlashcardPage.svelte`

#### 2a. Extend the `Mode` type

Change:

```ts
type Mode = 'noreng' | 'engnor';
```

to:

```ts
type Mode = 'noreng' | 'engnor' | 'defnor';
```

#### 2b. Update `getInitialMode()`

```ts
function getInitialMode(): Mode {
  if (!browser) return 'noreng';
  const saved = localStorage.getItem(LS_MODE);
  return saved === 'noreng' || saved === 'engnor' || saved === 'defnor' ? saved : 'noreng';
}
```

#### 2c. Change the mode-toggle button to a three-way cycle

The green "Norsk / English" button currently toggles between two modes. When `cardType === 'word'`, it should cycle through three states: `noreng` → `engnor` → `defnor` → `noreng`.

Replace the `onclick` and label logic:

```svelte
<!-- Mode button: two-way for phrases, three-way cycle for words -->
<button
  type="button"
  class={modeButtonCls}
  onclick={() => {
    if (cardType === 'phrase') {
      setMode(mode === 'noreng' ? 'engnor' : 'noreng');
    } else {
      // cycle: noreng → engnor → defnor → noreng
      const next: Record<Mode, Mode> = { noreng: 'engnor', engnor: 'defnor', defnor: 'noreng' };
      setMode(next[mode]);
    }
  }}
>
  {mode === 'noreng' ? m.flashcard_norsk() : mode === 'engnor' ? m.flashcard_english() : m.flashcard_definition()}
</button>
```

When `defnor` is selected, also force `cardType` to `'word'` (as the spec requires):

```ts
function setMode(mo: Mode) {
  if (mo === mode) return;
  mode = mo;
  if (mo === 'defnor' && cardType !== 'word') {
    cardType = 'word';
    localStorage.setItem(LS_CARD_TYPE, 'word');
  }
  localStorage.setItem(LS_MODE, mo);
}
```

#### 2d. Update `makeDeckItem()` to support `defnor`

```ts
function makeDeckItem(entry: VocabEntry, mo: Mode, ct: CardType): DeckItem {
  if (ct === 'phrase') {
    return {
      entry,
      front: mo === 'noreng' ? entry.example : entry.example_english,
      back: mo === 'noreng' ? entry.example_english : entry.example
    };
  }
  if (mo === 'defnor') {
    return {
      entry,
      front: entry.definition ?? entry.english, // fallback for entries without a definition
      back: entry.norsk
    };
  }
  return {
    entry,
    front: mo === 'noreng' ? entry.norsk : entry.english,
    back: mo === 'noreng' ? entry.english : entry.norsk
  };
}
```

#### 2e. Add the i18n key

In `messages/en.json`:

```json
"flashcard_definition": "Definition"
```

In `messages/nb.json`:

```json
"flashcard_definition": "Definisjon"
```

#### 2f. Filter out entries without definitions in `defnor` mode

In the deck-building helpers (`buildDeck` / `buildDueDeck`), when `mo === 'defnor'`, filter the entries to only those where `entry.definition` is non-empty. This prevents blank front-faces for A1/A2 words that have no definition field.

```ts
const filtered = mo === 'defnor' ? es.filter((e) => !!e.definition) : es;
// then use `filtered` instead of `es` in shuffle/due logic
```

---

### Pre-Implementation Concerns & Solutions

Three issues to address before or during implementation to ensure definition mode is reliable and polished.

---

#### Concern 1 — How many entries actually have a `definition`?

**Risk:** If a meaningful fraction of B1–C2 entries have an empty or missing `definition`, the filtered deck in `defnor` mode will be unexpectedly short with no explanation to the user.

**Solution — run a count before shipping:**

```bash
node -e "
const levels = ['b1','b2','c1','c2'];
for (const l of levels) {
  const data = require('./src/lib/data/vocab-' + l + '.json');
  const total = data.length;
  const withDef = data.filter(e => !!e.definition).length;
  console.log(l.toUpperCase() + ': ' + withDef + ' / ' + total + ' have definitions');
}
"
```

- If coverage is **≥ 95%** for a level, ship as-is.
- If coverage is **< 95%** for any level, backfill missing definitions in the JSON before enabling `defnor` for that level, or exclude that level from the definition-mode option in `PreferencesSection` with a note like _"Definitions not yet available for C1/C2."_

**UI safety net (regardless of coverage):** When `defnor` is active and the filtered deck count is zero, show an empty-state message rather than a broken blank deck:

```svelte
{#if defnorEntries.length === 0}
  <p class="text-center text-gray-500">
    {m.flashcard_no_definitions_available()}
  </p>
{/if}
```

Add `flashcard_no_definitions_available` to both `messages/en.json` and `messages/nb.json`.

---

#### Concern 2 — Definition quality spot-check

**Risk:** Definitions written or generated in bulk may vary in reading difficulty. A definition written at C1 level defeats the purpose of monolingual cards for a B1 learner.

**Solution — spot-check before shipping:**

Before implementing, do a quick manual scan across each level's JSON for:

- Definitions that contain the target word itself (circular definitions — e.g. _"Forurensning er når forurensning skjer…"_).
- Definitions whose sentences are noticeably longer or more complex than the B1 examples already in the file (those read at roughly A2/B1 level and are a good baseline).
- Any definition that appears to be in English (generation error).

A quick grep for English leakage:

```bash
node -e "
const levels = ['b1','b2','c1','c2'];
for (const l of levels) {
  const data = require('./src/lib/data/vocab-' + l + '.json');
  const suspects = data.filter(e => e.definition && /\b(the|is|are|when|that|which|used)\b/i.test(e.definition));
  if (suspects.length) console.log(l.toUpperCase(), suspects.map(e => e.norsk + ': ' + e.definition));
}
"
```

Fix any flagged entries in the JSON before implementing.

---

#### Concern 3 — Preference vs. cycle button staying in sync

**Risk:** A user sets `def_no` as their default in Preferences, then opens the flashcard page. The cycle button starts from the saved preference (`defnor`) correctly — but if the user switches categories (which may rebuild the deck), it's not obvious whether the mode persists or resets.

**Solution — verify `getInitialMode()` is called on page load only, not on category change:**

In `VocabFlashcardPage.svelte`, confirm that whenever the deck is rebuilt (category switch, level switch), the mode variable is NOT re-initialised. The `getInitialMode()` already reads from `localStorage` correctly (step 2b), so as long as the mode variable is not reset on category change, this is fine. Add a code comment to that effect to make the intent explicit:

```ts
// mode is intentionally NOT reset on category/level change —
// it persists from localStorage so the user's defnor preference is honoured.
let mode = $state<Mode>(getInitialMode());
```

Also confirm the cycle button label is visually distinct for each of the three states — the `m.flashcard_definition()` label from step 2c already handles this, but check that the button's colour or style differs enough from the `noreng`/`engnor` states so the user always knows they're in definition mode (e.g. a different background colour class for `defnor`).

---

### Summary of Files Changed

| File                                                        | Change                                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/lib/types.ts`                                          | `VocabEntry.definition` already present — no change needed                                                 |
| `src/lib/server/profile.ts`                                 | Add `'def_no'` to `card_direction` union                                                                   |
| `src/routes/my-profile/PreferencesSection.svelte`           | Conditional third radio option + note for B1+ Word mode                                                    |
| `src/lib/VocabFlashcardPage.svelte`                         | Extend `Mode` type, cycle button, `makeDeckItem`, entry filter                                             |
| `messages/en.json`                                          | Add `flashcard_definition`, `profile_prefs_card_direction_def_no`, `profile_prefs_card_direction_def_note` |
| `messages/nb.json`                                          | Same keys in Norwegian                                                                                     |
| `supabase/migrations/009_card_direction_def_no.sql` _(new)_ | Drop and re-add `profiles_card_direction_check` to allow `'def_no'`                                        |
