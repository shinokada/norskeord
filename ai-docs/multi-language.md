# Multi-Language Support Implementation Plan

## Goal

Allow users to study Norwegian vocabulary using their native language instead of English only. The flashcard mode is always `[selected language] ↔ norsk`. Routes stay unchanged. Language preference is persisted in localStorage.

---

## Supported Languages (initial)

| Code      | Name      | Flag |
| --------- | --------- | ---- |
| english   | English   | 🇬🇧   |
| spanish   | Spanish   | 🇪🇸   |
| ukrainian | Ukrainian | 🇺🇦   |

Add more by extending `LANGUAGES` in `src/lib/config.ts` — no other structural changes needed.

---

## JSON Data Structure

Each entry in all `src/lib/data/vocab-*.json` files gains new fields per language.

### Before

```json
{
  "norsk": "hei",
  "english": "hi",
  "example": "Hei! Hvordan har du det?",
  "example_english": "Hi! How are you?",
  "level": "A1",
  "category": "greetings",
  "part": "interjection"
}
```

### After

```json
{
  "id": "v-a1-greetings-001",
  "norsk": "hei",
  "english": "hi",
  "spanish": "hola",
  "ukrainian": "привіт",
  "example": "Hei! Hvordan har du det?",
  "example_english": "Hi! How are you?",
  "example_spanish": "¡Hola! ¿Cómo estás?",
  "example_ukrainian": "Привіт! Як справи?",
  "level": "A1",
  "category": "greetings",
  "part": "interjection"
}
```

### Field naming convention

- Translation field: `[language_code]` — e.g. `spanish`, `ukrainian`
- Example translation field: `example_[language_code]` — e.g. `example_spanish`
- `english` and `example_english` are **required** for every entry
- Translation fields (`spanish`, `ukrainian`) are **required** for every entry
- Example translation fields (`example_spanish`, `example_ukrainian`) are **optional** — not every word naturally has a useful example sentence in all languages, and the UI already guards with `{#if}`

---

## Files to Change

### 0. data: Spanish and Ukrainian

| file               | new data | Review Ukrainian | Review Spanish |
| ------------------ | -------- | ---------------- | -------------- |
| uttrykk-a1-preview | ✅ Done  | x                | x              |
| uttrykk-a1         | ✅ Done  | x                | x              |
| uttrykk-a2-preview | ✅ Done  | x                | x              |
| uttrykk-a2         | ✅ Done  | x                | x              |
| vocab-a1           | ✅ Done  | ✅ Done          | ✅ Done        |
| vocab-a2           | ✅ Done  | x                | x              |
| es.json            | ✅ Done  | -                | x              |
| uk.json            | ✅ Done  | x                | -              |

### 1. `src/lib/config.ts` ✅ Done

`LANGUAGES` lives here (not in `types.ts`) alongside `CATEGORIES_BY_LEVEL` and other pure constants.

```ts
export const LANGUAGES = {
  english: { name: 'English', flag: '🇬🇧' },
  spanish: { name: 'Spanish', flag: '🇪🇸' },
  ukrainian: { name: 'Ukrainian', flag: '🇺🇦' }
} as const;
```

### 2. `src/lib/types.ts` ✅ Done

`Language` type is derived from `LANGUAGES` imported from `$lib/config`. `VocabEntry` is extended with multi-language fields, a stable `id`, an optional `lemma`, and an optional monolingual `definition`.

```ts
import { CATEGORIES_BY_LEVEL, LANGUAGES } from '$lib/config';

export type Language = keyof typeof LANGUAGES;

export interface VocabEntry {
  id: string;
  lemma?: string;
  norsk: string;
  english: string;
  spanish: string;
  ukrainian: string;
  example: string;
  example_english: string; // required
  example_spanish?: string;
  example_ukrainian?: string;
  definition?: string; // monolingual Norwegian definition (B1+)
  level: CEFRLevel;
  category: Category;
  part: PartOfSpeech;
}
```

Note: `getTranslation` and `getExampleTranslation` are **not** in `types.ts` — they live in `src/lib/vocab-helpers.ts` (see section 3).

---

### 3. `src/lib/vocab-helpers.ts` ✅ Done

Type-safe helpers for dynamic field access. Centralises type assertions so they don't need to be scattered across components.

```ts
import type { VocabEntry, Language } from '$lib/types';

export function getTranslation(entry: VocabEntry, language: Language): string {
  return entry[language as keyof VocabEntry] as string;
}

export function getExampleTranslation(entry: VocabEntry, language: Language): string | undefined {
  return entry[`example_${language}` as keyof VocabEntry] as string | undefined;
}
```

---

### 4. `src/lib/stores/language.svelte.ts` ✅ Done

Svelte 5 rune-based store that reads/writes to localStorage. Imports `LANGUAGES` from `$lib/config`.

```ts
import { LANGUAGES } from '$lib/config';
import { type Language } from '$lib/types';

const STORAGE_KEY = 'norskeord-language';

function createLanguageStore() {
  let stored: Language | null = null;
  if (typeof localStorage !== 'undefined') {
    try {
      stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    } catch (e) {
      console.warn('Failed to read language preference from localStorage:', e);
    }
  }

  // Guard against stale or invalid stored values
  const initial: Language = stored && stored in LANGUAGES ? stored : 'english';

  let current = $state<Language>(initial);

  return {
    get current() {
      return current;
    },
    set(lang: Language) {
      current = lang;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
          console.warn('Failed to save language preference to localStorage:', e);
        }
      }
    }
  };
}

export const languageStore = createLanguageStore();
```

**Notes:**

- `typeof localStorage !== 'undefined'` guards against SSR
- `localStorage` calls are wrapped in try-catch — some browsers with strict privacy settings or exceeded storage quota can throw
- `stored in LANGUAGES` protects against invalid values if languages are renamed or removed in future
- Defaults to `'english'` if nothing is stored

---

### 5. `src/lib/VocabFlashcardPage.svelte` ✅ Done

Accepts a `language` prop of type `Language`. Uses it to pick the translation dynamically in the mode buttons and `makeDeckItem`.

#### Props

```ts
import type { VocabEntry, Language } from '$lib/types';
import { LANGUAGES } from '$lib/config';

interface Props {
  entries: VocabEntry[];
  title?: string;
  language?: Language;
  level?: string;
  prevCategory?: CategoryNav | null;
  nextCategory?: CategoryNav | null;
}

let {
  entries,
  title = 'Vocab',
  level = '',
  prevCategory = null,
  nextCategory = null,
  language = 'english'
}: Props = $props();
```

#### `makeDeckItem`

For `word` cards in `noreng`/`engnor` mode, the translation is picked via the `language` prop (falling back to `english` for phrase cards, which always use `example_english`):

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
      front: entry.definition ?? entry.english,
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

> **Note:** `makeDeckItem` currently uses `entry.english` directly rather than `getTranslation(entry, language)`. If you want Spanish/Ukrainian to appear on the card fronts/backs, update this function to use `getTranslation(entry, language)` and `getExampleTranslation(entry, language)` instead.

#### Mode button labels ✅ Done

```svelte
<button onclick={() => setMode('noreng')}>
  Norsk → {LANGUAGES[language].name}
</button>
<button onclick={() => setMode('engnor')}>
  {LANGUAGES[language].name} → Norsk
</button>
```

#### Example section ✅ Done

Looking at the current code, here's exactly what needs to change:

**`deriveExample`** — this one is fine as-is for word cards (it shows the Norwegian example sentence). But for phrase cards, the "front" in `engnor` mode shows `entry.english` — that should become the selected language's translation.

**`deriveExampleTranslation`** — this always returns `entry.example_english` regardless of the selected language. It needs to return the language-specific example translation instead.

---

##### `deriveExample` — before

```ts
function deriveExample(entry: VocabEntry, mo: Mode, ct: CardType): string {
  if (ct === 'phrase') return mo === 'noreng' ? entry.norsk : entry.english;
  return mo === 'noreng' ? entry.example : entry.example_english;
}
```

##### `deriveExample` — after

```ts
function deriveExample(entry: VocabEntry, mo: Mode, ct: CardType): string {
  if (ct === 'phrase') return mo === 'noreng' ? entry.norsk : getTranslation(entry, language);
  return mo === 'noreng' ? entry.example : entry.example_english;
}
```

---

##### `deriveExampleTranslation` — before

```ts
function deriveExampleTranslation(entry: VocabEntry, mo: Mode, ct: CardType): string {
  if (ct === 'phrase') return mo === 'noreng' ? entry.english : entry.norsk;
  return mo === 'noreng' ? entry.example_english : entry.example;
}
```

##### `deriveExampleTranslation` — after

```ts
function deriveExampleTranslation(entry: VocabEntry, mo: Mode, ct: CardType): string {
  if (ct === 'phrase') return mo === 'noreng' ? getTranslation(entry, language) : entry.norsk;
  return mo === 'noreng'
    ? (getExampleTranslation(entry, language) ?? entry.example_english)
    : entry.example;
}
```

##### What changed and why

**`deriveExample`, phrase mode, `engnor`:** Was `entry.english`, now `getTranslation(entry, language)`. In phrase card mode the "front" shows the translation side — that should be Spanish/Ukrainian when the user has selected that language.

**`deriveExampleTranslation`, phrase mode, `noreng`:** Was `entry.english`, now `getTranslation(entry, language)`. Same logic — the "translation" shown below a Norwegian phrase should be in the user's selected language.

**`deriveExampleTranslation`, word mode, `noreng`:** Was `entry.example_english`, now `getExampleTranslation(entry, language) ?? entry.example_english`. This is the main fix — the example sentence translation shown under a word card will now be in Spanish/Ukrainian when available, falling back to English if no translation exists for that language yet.

## The word card `engnor` branch (`entry.example`) is unchanged — that always shows the Norwegian example, which is correct regardless of language.

### 6. `src/routes/components/Nav.svelte`

Followings are OLD without considering in depth. Please see ai-docs/implementation/new-languages.md for more details.

Add a language selector dropdown driven by `LANGUAGES`. Import `languageStore` and show the currently active language.

```svelte
<script lang="ts">
  import { Dropdown, DropdownItem } from 'flowbite-svelte';
  import { LANGUAGES } from '$lib/config';
  import type { Language } from '$lib/types';
  import { languageStore } from '$lib/stores/language.svelte';
</script>

<!-- Add to navbar, next to DarkMode toggle -->
<div class="relative">
  <button class="flex items-center gap-1 px-2 py-1 text-sm">
    {LANGUAGES[languageStore.current].flag}
    {LANGUAGES[languageStore.current].name}
    <ChevronDownOutline size="sm" />
  </button>
  <Dropdown>
    {#each Object.entries(LANGUAGES) as [code, { name, flag }]}
      <DropdownItem
        onclick={() => languageStore.set(code as Language)}
        class={languageStore.current === code ? 'font-semibold' : ''}
      >
        {flag}
        {name}
      </DropdownItem>
    {/each}
  </Dropdown>
</div>
```

---

### 7. `src/routes/[level]/[category]/+page.svelte`

Pass `language` from the store to `VocabFlashcardPage`.

```svelte
<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { languageStore } from '$lib/stores/language.svelte';
  import { removeHyphensAndCapitalize } from '$lib/utils';

  let { data } = $props();
  let title = $derived(`Nivå ${data.level} — ${removeHyphensAndCapitalize(data.category)}`);
</script>

{#if data.entries.length > 0}
  <VocabFlashcardPage entries={data.entries} {title} language={languageStore.current} />
{:else}
  ...
{/if}
```

---

### 8. `src/lib/data/vocab-*.json` _(all 6 files)_

Add translation and example fields for every language to every entry. This is the largest part of the work.

Files to update:

- `src/lib/data/vocab-a1.json`
- `src/lib/data/vocab-a2.json`
- `src/lib/data/vocab-b1.json`

For b1+ we use only Norwegian. So the following files stay as it is:

- `src/lib/data/vocab-b2.json`
- `src/lib/data/vocab-c1.json`
- `src/lib/data/vocab-c2.json`

---

## AI Prompt Template for JSON Updates

Use this prompt to generate the new fields for each batch of entries:

> For each entry in the following JSON array, add these fields:
>
> - `"spanish"` — the Spanish translation of the `norsk` field
> - `"ukrainian"` — the Ukrainian translation of the `norsk` field
> - `"example_spanish"` — a natural Spanish sentence using only **A1**-level vocabulary that translates `example` (omit if no natural translation exists)
> - `"example_ukrainian"` — same in Ukrainian
>
> Return only the updated JSON array with no explanation.

**Important:** Replace `A1` in the prompt above with the actual CEFR level of the file being processed (`A1`, `A2`, `B1`, `B2`, `C`). For example, when processing `vocab-b1.json`, use `B1`-level vocabulary in the example sentences.

**Quality assurance:** Since translations are AI-generated in bulk, spot-check a sample of entries per level (5–10 words) against a dictionary or native speaker before shipping. Pay particular attention to words with multiple meanings where context matters.

---

## Pending Work

| Item                                                                                                      | Status         |
| --------------------------------------------------------------------------------------------------------- | -------------- |
| `makeDeckItem` — use `getTranslation(entry, language)` for card fronts/backs                              | ⬜ TODO        |
| `deriveExampleTranslation` — use `getExampleTranslation(entry, language)` with `example_english` fallback | ⬜ TODO        |
| Nav language selector dropdown                                                                            | ⬜ TODO        |
| Pass `language` from store in `[level]/[category]/+page.svelte`                                           | ⬜ TODO        |
| Add Spanish/Ukrainian data to remaining vocab JSON files                                                  | ⬜ In progress |

---

## Adding a New Language in Future

1. Add an entry to `LANGUAGES` in `src/lib/config.ts`
2. Add the field to `VocabEntry` interface in `src/lib/types.ts` (e.g. `french: string; example_french?: string`)
3. Add the fields to all JSON data files
4. No other code changes needed — the nav dropdown and flashcard logic are driven by `LANGUAGES` dynamically

---

## TypeScript Consideration

Accessing `entry[language]` and ``entry[`example_${language}`]`` dynamically requires type assertions since TypeScript cannot narrow template literal keys at compile time. Rather than scattering these assertions across components, use the `getTranslation` and `getExampleTranslation` helpers defined in `src/lib/vocab-helpers.ts` (see section 3 above). This centralises all assertions in one place and keeps component code clean.

---

## Summary of Changes

| File                                         | Type    | Change                                                   |
| -------------------------------------------- | ------- | -------------------------------------------------------- |
| `src/lib/config.ts`                          | Modify  | Add `LANGUAGES` config                                   |
| `src/lib/types.ts`                           | Modify  | Add `Language` type, extend `VocabEntry` with new fields |
| `src/lib/vocab-helpers.ts`                   | Modify  | Add `getTranslation`, `getExampleTranslation` helpers    |
| `src/lib/stores/language.svelte.ts`          | **New** | localStorage-backed language store                       |
| `src/lib/VocabFlashcardPage.svelte`          | Modify  | Accept `language` prop, dynamic mode button labels       |
| `src/routes/components/Nav.svelte`           | Modify  | Add language dropdown                                    |
| `src/routes/[level]/[category]/+page.svelte` | Modify  | Pass `language` from store                               |
| `src/lib/data/vocab-*.json`                  | Modify  | Add translation + example fields per language            |
