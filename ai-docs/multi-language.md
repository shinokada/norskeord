# Multi-Language Support Implementation Plan

## Goal

Allow users to study Norwegian vocabulary using their native language instead of English only. The flashcard mode is always `[selected language] ↔ norsk`. Routes stay unchanged. Language preference is persisted in localStorage.

---

## Supported Languages (initial)

| Code      | Name      | Flag |
| --------- | --------- | ---- |
| english   | English   | 🇺🇸    |
| spanish   | Spanish   | 🇪🇸    |
| ukrainian | Ukrainian | 🇺🇦    |
| polish    | Polish    | 🇵🇱    |

Add more by extending `LANGUAGES` in `src/lib/types.ts` — no other structural changes needed.

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
	"norsk": "hei",
	"english": "hi",
	"spanish": "hola",
	"ukrainian": "привіт",
	"polish": "cześć",
	"example": "Hei! Hvordan har du det?",
	"example_english": "Hi! How are you?",
	"example_spanish": "¡Hola! ¿Cómo estás?",
	"example_ukrainian": "Привіт! Як справи?",
	"example_polish": "Cześć! Jak się masz?",
	"level": "A1",
	"category": "greetings",
	"part": "interjection"
}
```

### Field naming convention

- Translation field: `[language_code]` — e.g. `spanish`, `ukrainian`, `polish`
- Example translation field: `example_[language_code]` — e.g. `example_spanish`
- Translation fields (`spanish`, `ukrainian`, `polish`) are **required** for every entry
- Example translation fields (`example_spanish`, `example_ukrainian`, `example_polish`) are **optional** — not every word naturally has a useful example sentence in all languages, and the UI already guards with `{#if}`

---

## Files to Change

### 1. `src/lib/types.ts`

Add `LANGUAGES` config and `Language` type. Extend `VocabEntry` with new fields.

```ts
export const LANGUAGES = {
	english: { name: 'English', flag: '🇺🇸' },
	spanish: { name: 'Spanish', flag: '🇪🇸' },
	ukrainian: { name: 'Ukrainian', flag: '🇺🇦' },
	polish: { name: 'Polish', flag: '🇵🇱' }
} as const;

export type Language = keyof typeof LANGUAGES;

export interface VocabEntry {
	norsk: string;
	english: string;
	spanish: string;
	ukrainian: string;
	polish: string;
	example: string;
	example_english?: string;
	example_spanish?: string;
	example_ukrainian?: string;
	example_polish?: string;
	level: CEFRLevel;
	category: Category;
	part: PartOfSpeech;
}

// Type-safe helpers for dynamic field access — centralises type assertions
// so they don't need to be scattered across components.
export function getTranslation(entry: VocabEntry, language: Language): string {
	return entry[language as keyof VocabEntry] as string;
}

export function getExampleTranslation(entry: VocabEntry, language: Language): string | undefined {
	return entry[`example_${language}` as keyof VocabEntry] as string | undefined;
}
```

---

### 2. `src/lib/stores/language.svelte.ts` _(new file)_

Svelte 5 rune-based store that reads/writes to localStorage.

```ts
import { LANGUAGES, type Language } from '$lib/types';

const STORAGE_KEY = 'norske-flashcard-language';

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
- `localStorage.getItem()` and `localStorage.setItem()` are wrapped in try-catch — in some browsers with strict privacy settings or when storage quota is exceeded these can throw
- The `stored in LANGUAGES` guard protects against invalid values if languages are renamed or removed in future
- Defaults to `'english'` if nothing is stored

---

### 3. `src/lib/VocabFlashcardPage.svelte`

Accept a `language` prop of type `Language`. Use it to pick the translation and example sentence dynamically.

#### Props change

```ts
import type { Language } from '$lib/types';

interface Props {
	entries: VocabEntry[];
	title?: string;
	language?: Language;
}

let { entries, title = 'Vocab', language = 'english' }: Props = $props();
```

#### `makeItem` change

```ts
import { getTranslation } from '$lib/types';

function makeItem(entry: VocabEntry, m: Mode): HistoryItem {
	const translation = getTranslation(entry, language);
	return {
		entry,
		front: m === 'noreng' ? entry.norsk : translation,
		back: m === 'noreng' ? translation : entry.norsk
	};
}
```

#### Mode button labels change

Update button labels to reflect the selected language dynamically:

```svelte
<button onclick={() => setMode('noreng')}>
	Norsk → {LANGUAGES[language].name}
</button>
<button onclick={() => setMode('engnor')}>
	{LANGUAGES[language].name} → Norsk
</button>
```

#### Example section change

```svelte
<script lang="ts">
	import { getExampleTranslation } from '$lib/types';
</script>

{#if current}
	<div class="...">
		<p class="italic ...">"{current.entry.example}"</p>
		{#if getExampleTranslation(current.entry, language)}
			<div class="mt-2">
				{#if showExampleTranslation}
					<p class="...">"{getExampleTranslation(current.entry, language)}"</p>
				{/if}
				<button onclick={() => (showExampleTranslation = !showExampleTranslation)}>
					{showExampleTranslation ? 'Hide translation' : 'Show translation'}
				</button>
			</div>
		{/if}
	</div>
{/if}
```

> **Note:** `showExampleEnglish` should be renamed to `showExampleTranslation` to reflect that it now controls any language, not just English.

---

### 4. `src/routes/components/Nav.svelte`

Add a language selector dropdown driven by `LANGUAGES`. Import `languageStore` and show the currently active language.

```svelte
<script lang="ts">
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { LANGUAGES } from '$lib/types';
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

### 5. `src/routes/[level]/[category]/+page.svelte`

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

### 6. `src/lib/data/vocab-*.json` _(all 6 files)_

Add translation and example fields for every language to every entry. This is the largest part of the work — likely done with an AI generation script or prompt batch.

Files to update:

- `src/lib/data/vocab-a1.json`
- `src/lib/data/vocab-a2.json`
- `src/lib/data/vocab-b1.json`
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
> - `"polish"` — the Polish translation of the `norsk` field
> - `"example_spanish"` — a natural Spanish sentence using only **A1**-level vocabulary that translates `example` (omit if no natural translation exists)
> - `"example_ukrainian"` — same in Ukrainian
> - `"example_polish"` — same in Polish
>
> Return only the updated JSON array with no explanation.

**Important:** Replace `A1` in the prompt above with the actual CEFR level of the file being processed (`A1`, `A2`, `B1`, `B2`, `C1`, or `C2`). For example, when processing `vocab-b1.json`, use `B1`-level vocabulary in the example sentences.

**Quality assurance:** Since translations are AI-generated in bulk, spot-check a sample of entries per level (5–10 words) against a dictionary or native speaker before shipping. Pay particular attention to words with multiple meanings where context matters.

---

## Adding a New Language in Future

1. Add an entry to `LANGUAGES` in `src/lib/types.ts`
2. Add the field to `VocabEntry` interface (e.g. `french: string; example_french?: string`)
3. Add the fields to all JSON data files
4. No other code changes needed — the nav dropdown and flashcard logic are driven by `LANGUAGES` dynamically

---

## TypeScript Consideration

+Accessing `entry[language]` and `entry[\`example_\${language}\`]` dynamically requires type assertions since TypeScript cannot narrow template literal keys at compile time. Rather than scattering these assertions across components, use the `getTranslation` and `getExampleTranslation` helpers defined in `src/lib/types.ts` (see section 1 above). This centralises all assertions in one place and keeps component code clean.

---

## Summary of Changes

| File                                         | Type    | Change                                                |
| -------------------------------------------- | ------- | ----------------------------------------------------- |
| `src/lib/types.ts`                           | Modify  | Add `LANGUAGES`, `Language` type, extend `VocabEntry` |
| `src/lib/stores/language.svelte.ts`          | **New** | localStorage-backed language store                    |
| `src/lib/VocabFlashcardPage.svelte`          | Modify  | Accept `language` prop, dynamic translation/example   |
| `src/routes/components/Nav.svelte`           | Modify  | Add language dropdown                                 |
| `src/routes/[level]/[category]/+page.svelte` | Modify  | Pass `language` from store                            |
| `src/lib/data/vocab-*.json`                  | Modify  | Add translation + example fields per language         |
