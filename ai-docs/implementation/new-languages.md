# New Languages — Implementation Plan

Status: all app code complete ✅

## Goal

Add Spanish and Ukrainian as full languages — both as an **interface language**
(the paraglide-driven UI chrome: nav, buttons, profile, onboarding — currently
`en`/`nb`) and as a **flashcard language** (the translation side of a vocab
card — currently `english`/`spanish`/`ukrainian` via `LANGUAGES` in
`src/lib/config.ts`). These are two separate concerns that happen to share a
config object, and most of the work below is about wiring them up correctly
and consistently rather than adding new ideas.

Future languages should only require: a new `LANGUAGES` entry, a new
`messages/<code>.json`, a data pass on the vocab JSON files, and one
extension to two DB CHECK constraints.

## Decisions this plan is built on

1. `LANGUAGES` gets a `code` field per entry (ISO 639-1 / paraglide locale)
   to bridge the vocab-field naming convention (`spanish`, `ukrainian`) and
   the paraglide locale codes (`es`, `uk`).
2. `norwegian` is excluded from the **Flashcard language** picker everywhere
   (Preferences and onboarding) — it stays valid only for **Interface
   language**.
3. Interface-language support is generalized everywhere it's currently
   hardcoded to `'en' | 'nb'`, including a Supabase migration.
4. `card_direction` is generalized to language-agnostic values
   (`l1_l2` / `l2_l1` / `def_l1`), and a new `flashcard_language` column is
   added so the flashcard-language preference syncs cross-device for Plus
   users like every other preference already does. Existing rows are
   migrated, not just defaulted.
5. Onboarding: slide 1's interface-language toggle becomes a dropdown **in
   place**. There is no separate Flashcard-language slide — `flashcard_language`
   defaults to whatever `LANGUAGES` key matches the chosen UI-language code
   (via `languageEntryForLocale`), falling back to `english` when the UI
   language is `norwegian` (not a valid flashcard language). The only place
   to override this default is the Flashcard-language dropdown in
   Preferences (§11).
6. Spanish/Ukrainian data is being added to B1 (`vocab-b1.json`,
   `uttrykk-b1-preview.json`, `uttrykk-b1.json`) as well as A1/A2, so the
   Flashcard-language picker is never hidden or disabled by level. Missing
   fields (B2/C, until/unless translated) fall back to English at the data
   layer, not by hiding the control.
7. The `makeDeckItem()` bug in `VocabFlashcardPage.svelte` (word/phrase
   fronts and backs hardcode `entry.english`, ignoring the `language` prop)
   is in scope and gets fixed here.
8. The `if (ui_language === 'nb') redirect(302, '/nb/my-profile')` in
   `my-profile/+page.server.ts` is a bug and is removed outright — switching
   language already updates `/my-profile` in place via `localeStore`, no
   redirect or locale-prefixed path is needed.
9. **(Revision, June 2026)** `native_language`, `other_languages`, and
   `country` are dropped from the onboarding slide flow entirely — none of
   them currently drive `ui_language`, `flashcard_language`, or anything
   else downstream, so the dedicated slides (and the native-language-driven
   auto-suggestion from the original decision 5) were overhead without
   payoff. Since there are no users/rows yet, the columns are dropped
   outright in migration 020 rather than left unused — see that migration's
   header for the deployment-ordering caveat (it must ship together with
   §1–§13's app-code changes, not before them). See the rewritten §13 below
   for the resulting slide flow.

---

## 1. `src/lib/config.ts`

Add a `code` field to every `LANGUAGES` entry, and derive the
flashcard-only subset (everything except `norwegian`) right next to it so
there's exactly one place that excludes Norwegian from the flashcard
picker.

```ts
export const LANGUAGES = {
  norwegian: { name: 'Norwegian', flag: '🇳🇴', code: 'nb' },
  english: { name: 'English', flag: '🇬🇧', code: 'en' },
  spanish: { name: 'Spanish', flag: '🇪🇸', code: 'es' },
  ukrainian: { name: 'Ukrainian', flag: '🇺🇦', code: 'uk' }
} as const;

/**
 * LANGUAGES minus `norwegian` — the set of valid *flashcard* translation
 * languages. Norwegian is the language being learned, so translating
 * Norwegian → Norwegian doesn't make sense; it stays valid only as an
 * *interface* language (see `Locale` in `localeStore.svelte.ts`).
 */
export const FLASHCARD_LANGUAGES = Object.fromEntries(
  Object.entries(LANGUAGES).filter(([key]) => key !== 'norwegian')
) as Omit<typeof LANGUAGES, 'norwegian'>;

/** Reverse lookup — given a paraglide locale code, find its LANGUAGES entry. */
export function languageEntryForLocale(code: string) {
  return Object.entries(LANGUAGES).find(([, v]) => v.code === code);
}
```

Note: `LANGUAGES[*].name` stays an English-only label (`'Spanish'`, not
`'Español'`) — that already matches the existing convention in
`VocabFlashcardPage.svelte`'s mode-button labels (`Norsk → {LANGUAGES[language].name}`),
which is not re-localized per interface language today. This plan doesn't
change that; flag separately if you want per-locale native names later.

---

## 2. `src/lib/types.ts`

```ts
export type Language = keyof typeof LANGUAGES; // 'norwegian' | 'english' | 'spanish' | 'ukrainian'
export type FlashcardLanguage = keyof typeof FLASHCARD_LANGUAGES; // 'english' | 'spanish' | 'ukrainian'

export interface VocabEntry {
  id: string;
  lemma?: string;
  norsk: string;
  english: string;
  spanish?: string; // optional: only A1/A2/B1 have this so far
  ukrainian?: string; // optional: same caveat
  example: string;
  example_english: string;
  example_spanish?: string;
  example_ukrainian?: string;
  definition?: string;
  level: CEFRLevel;
  category: Category;
  part: PartOfSpeech;
}
```

`spanish`/`ukrainian` move from required to optional — they're only
guaranteed on A1/A2 (and soon B1); B2/C entries genuinely don't have them on
disk today, so the type should say so. `getTranslation()` below absorbs the
fallback so nothing downstream needs an `?? entry.english` of its own.

`Profile` (re-exported from `$lib/server/profile.ts`, see §5) also widens:

```ts
export interface Profile {
  // ...
  ui_language: Locale; // was 'en' | 'nb' — see §6 for the Locale type
  flashcard_language: FlashcardLanguage; // new
  card_direction: 'l1_l2' | 'l2_l1' | 'def_l1'; // was 'no_en' | 'en_no' | 'def_no'
  // ...
}
```

---

## 3. `src/lib/vocab-helpers.ts`

```ts
export function getTranslation(entry: VocabEntry, language: FlashcardLanguage): string {
  if (language === 'english') return entry.english;
  return entry[language] ?? entry.english;
}

export function getExampleTranslation(
  entry: VocabEntry,
  language: FlashcardLanguage
): string | undefined {
  if (language === 'english') return entry.example_english;
  return entry[`example_${language}`];
}
```

Narrowing the parameter type to `FlashcardLanguage` (instead of the broader
`Language`) means `entry[language]` type-checks directly — no
`as keyof VocabEntry` cast needed — and it's a compile-time guarantee that
`'norwegian'` can never reach this function. The `?? entry.english` fallback
is what lets B2/C categories (which don't have `spanish`/`ukrainian` fields
yet) degrade gracefully instead of rendering `undefined`.

---

## 4. Database migration — `supabase/migrations/020_multi_language_prefs.sql`

Three changes in one migration: widen `ui_language`, add `flashcard_language`,
and generalize `card_direction`. Order matters for the last one — the old
constraint must be dropped _before_ the `UPDATE`s, or the new values would
violate it.

```sql
-- Migration 020: Generalize language preferences for multi-language support
--
-- 1. Widen ui_language to accept the new interface locales (es, uk).
-- 2. Add flashcard_language — previously this lived only in localStorage
--    (`languageStore`), so Plus users' choice never synced cross-device
--    like every other preference does.
-- 3. Generalize card_direction from English-specific values (no_en/en_no/def_no)
--    to language-agnostic ones (l1_l2/l2_l1/def_l1): l1 is always Norwegian,
--    l2 is whatever flashcard_language is set to.
--
-- Verify constraint names before running (see migration 009 for the lookup query):
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.profiles'::regclass AND contype = 'c';

-- 1. ui_language
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ui_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ui_language_check
  CHECK (ui_language = ANY (ARRAY['en'::text, 'nb'::text, 'es'::text, 'uk'::text]));

-- 2. flashcard_language (new column — NOT NULL DEFAULT backfills existing rows,
--    since English was the only option before this migration anyway)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS flashcard_language text NOT NULL DEFAULT 'english';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_flashcard_language_check
  CHECK (flashcard_language = ANY (ARRAY['english'::text, 'spanish'::text, 'ukrainian'::text]));

-- 3. card_direction — drop the old constraint BEFORE migrating values
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_card_direction_check;

UPDATE public.profiles SET card_direction = 'l1_l2' WHERE card_direction = 'no_en';
UPDATE public.profiles SET card_direction = 'l2_l1' WHERE card_direction = 'en_no';
UPDATE public.profiles SET card_direction = 'def_l1' WHERE card_direction = 'def_no';

ALTER TABLE public.profiles
  ALTER COLUMN card_direction SET DEFAULT 'l1_l2';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_card_direction_check
  CHECK (card_direction = ANY (ARRAY['l1_l2'::text, 'l2_l1'::text, 'def_l1'::text]));
```

Adding a future language later means appending to two `ARRAY[...]` literals
(`ui_language`, `flashcard_language`) in a small follow-up migration — same
pattern this codebase already uses (see migration 009 for `card_direction`).

---

## 5. `src/lib/server/profile.ts`

```ts
export interface Profile {
  // ...
  ui_language: 'en' | 'nb' | 'es' | 'uk';
  flashcard_language: 'english' | 'spanish' | 'ukrainian';
  card_direction: 'l1_l2' | 'l2_l1' | 'def_l1';
  // ...
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'display_name'
    | 'current_level'
    | 'ui_language'
    | 'flashcard_language' // new
    | 'card_direction'
    | 'include_phrases'
    // ...unchanged fields...
  >
>;
```

(Consider importing `Locale`/`FlashcardLanguage` from `$lib/types` instead
of repeating the literal unions here, but that's a style call — both are
equivalent as long as they stay in sync with §1/§2.)

---

## 6. `src/lib/localeStore.svelte.ts`

```ts
import { getLocale, setLocale } from '$lib/paraglide/runtime';
import { LANGUAGES } from '$lib/config';

export type Locale = (typeof LANGUAGES)[keyof typeof LANGUAGES]['code']; // 'nb' | 'en' | 'es' | 'uk'

function createLocaleStore() {
  let current = $state<Locale>(getLocale() as Locale);

  function set(next: Locale, options?: { reload?: boolean }) {
    current = next;
    localStorage.setItem('locale', next);
    setLocale(next, { reload: options?.reload ?? false });
  }

  function init() {
    const saved = localStorage.getItem('locale');
    // any LANGUAGES code is now valid, not just 'en'/'nb'
    if (saved && Object.values(LANGUAGES).some((l) => l.code === saved)) {
      set(saved as Locale, { reload: false });
    }
  }

  return {
    get current() {
      return current;
    },
    set,
    init
  };
}

export const localeStore = createLocaleStore();
```

Deriving `Locale` from `LANGUAGES[*].code` (rather than a manually-duplicated
literal union) means adding a 5th interface language only requires editing
`LANGUAGES` in `config.ts` — this type widens automatically.

---

## 7. `src/lib/stores/language.svelte.ts`

Only the validity check changes — swap `LANGUAGES` for `FLASHCARD_LANGUAGES`
so a stored `'norwegian'` (which should never happen via the UI, but
defensively) falls back to English rather than being accepted:

```ts
import { FLASHCARD_LANGUAGES } from '$lib/config';
import { type FlashcardLanguage } from '$lib/types';

const STORAGE_KEY = 'norskeord-language';

function createLanguageStore() {
  let stored: FlashcardLanguage | null = null;
  if (typeof localStorage !== 'undefined') {
    try {
      stored = localStorage.getItem(STORAGE_KEY) as FlashcardLanguage | null;
    } catch (e) {
      console.warn('Failed to read language preference from localStorage:', e);
    }
  }

  const initial: FlashcardLanguage = stored && stored in FLASHCARD_LANGUAGES ? stored : 'english';
  let current = $state<FlashcardLanguage>(initial);

  return {
    get current() {
      return current;
    },
    set(lang: FlashcardLanguage) {
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

This store stays localStorage-only for guests/free users; §11 wires the DB
`flashcard_language` column (Plus, cross-device) and §15 wires this store
into `VocabFlashcardPage`.

---

## 8. `src/routes/components/Nav.svelte`

Replace the binary `toggleLocale()` button with a dropdown over all of
`LANGUAGES` (all four currently have a `messages/<code>.json`, so no
filtering needed here — see the caveat in §16 if that ever changes).

```svelte
<script lang="ts">
  import { LANGUAGES, languageEntryForLocale } from '$lib/config';
  import { localeStore, type Locale } from '$lib/localeStore.svelte';
  // ...existing imports...

  let langDropdownOpen = $state(false);
  let currentLangEntry = $derived(languageEntryForLocale(localeStore.current));

  async function switchLocale(code: Locale) {
    if (code === localeStore.current) return;
    localeStore.set(code);
    langDropdownOpen = false;
    if (effectiveUser) {
      try {
        await fetch('/api/profile/language', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale: code })
        });
      } catch {
        console.warn('[Nav] Failed to persist locale to profile');
      }
    }
  }
</script>

<div class="relative">
  <button
    type="button"
    onclick={() => (langDropdownOpen = !langDropdownOpen)}
    aria-label="Switch language"
    class="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
  >
    {currentLangEntry?.[1].flag}
    {currentLangEntry?.[1].name}
    <ChevronDownOutline class="h-4 w-4" />
  </button>
  <Dropdown bind:isOpen={langDropdownOpen} simple class="dark:border-gray-700 dark:bg-blue-950">
    {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
      <DropdownItem
        class="dark:hover:bg-blue-900 {localeStore.current === code ? 'font-semibold' : ''}"
        onclick={() => switchLocale(code)}
      >
        {flag}
        {name}
      </DropdownItem>
    {/each}
  </Dropdown>
</div>
```

This drops the now-unused `languageStore`/`Language` imports that were sitting
unused in the current `Nav.svelte` (the Flashcard-language picker lives in
Preferences + onboarding only, per the original doc's structure — it's not
duplicated in the nav).

---

## 9. `src/routes/api/profile/language/+server.ts`

Widen validation from a hardcoded pair to all `LANGUAGES` codes:

```ts
import { LANGUAGES } from '$lib/config';

const VALID_LOCALES = Object.values(LANGUAGES).map((l) => l.code); // ['nb','en','es','uk']
type Locale = (typeof VALID_LOCALES)[number];

// ...rest of the handler is unchanged — it already does
// `upsertProfile(..., { ui_language: locale })`.
```

---

## 10. `src/routes/api/profile/onboarding/+server.ts`

Add `flashcard_language` to the accepted/validated fields, using the same
allow-list pattern as the existing fields:

```ts
import { FLASHCARD_LANGUAGES } from '$lib/config';

const VALID_FLASHCARD_LANGUAGES = new Set(Object.keys(FLASHCARD_LANGUAGES));

// ...inside the PATCH handler, alongside the other `if ('x' in body)` blocks:
if ('flashcard_language' in body) {
  const lang = body.flashcard_language as string | null;
  if (lang && !VALID_FLASHCARD_LANGUAGES.has(lang)) {
    error(422, { message: 'Invalid flashcard language.' });
  }
  update.flashcard_language = lang || 'english';
}
```

---

## 11. `src/routes/my-profile/PreferencesSection.svelte`

Three changes: Interface language becomes a dropdown of all 4 languages,
a new Flashcard-language dropdown is added (excluding Norwegian), and Card
direction's labels/values become dynamic instead of hardcoded English.

```ts
import { LANGUAGES, FLASHCARD_LANGUAGES } from '$lib/config';
import type { FlashcardLanguage } from '$lib/types';

// Interface language — was a 2-way bind to localeStore.current; now drives a <select>
let uiLanguage = $derived.by<Locale>(() => localeStore.current);

// Flashcard language — new. $state (not derived) since there's no existing
// reactive store value to mirror the way uiLanguage mirrors localeStore;
// languageStore.current seeds the initial value, matching the pattern used
// for cardDirection below.
let flashcardLanguage = $state<FlashcardLanguage>(
  untrack(() => (profile?.flashcard_language ?? languageStore.current) as FlashcardLanguage)
);

// Card direction labels are now built from the selected flashcard language's
// display name instead of from static, English-baked-in message strings.
let cardDirectionOptions = $derived.by(() => {
  const l2 = LANGUAGES[flashcardLanguage].name;
  const base = [
    { value: 'l1_l2', label: `Norsk → ${l2}` },
    { value: 'l2_l1', label: `${l2} → Norsk` }
  ];
  if (cardType === 'word' && B1_PLUS_LEVELS.has(currentLevel)) {
    return [...base, { value: 'def_l1', label: `${m.flashcard_definition()} → Norsk` }];
  }
  return base;
});
```

```svelte
<!-- Interface language -->
<div>
  <label for="ui_language" class="mb-1 block text-sm font-medium ...">
    {m.profile_prefs_ui_language()}
  </label>
  <select id="ui_language" name="ui_language" bind:value={uiLanguage} class="...">
    {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
      <option value={code}>{flag} {name}</option>
    {/each}
  </select>
  <p class="mt-1 text-xs ...">{m.profile_prefs_ui_language_hint()}</p>
</div>

<!-- Flashcard language (new) -->
<div>
  <label for="flashcard_language" class="mb-1 block text-sm font-medium ...">
    {m.profile_prefs_flashcard_language()}
  </label>
  <select
    id="flashcard_language"
    name="flashcard_language"
    bind:value={flashcardLanguage}
    class="..."
  >
    {#each Object.entries(FLASHCARD_LANGUAGES) as [key, { name, flag }] (key)}
      <option value={key}>{flag} {name}</option>
    {/each}
  </select>
  <p class="mt-1 text-xs ...">{m.profile_prefs_flashcard_language_hint()}</p>
</div>
```

`applyToLocalStorage()`'s mode map updates to the new generic values, and
also writes through `languageStore` so `VocabFlashcardPage` picks up the
change immediately without a reload:

```ts
function applyToLocalStorage() {
  const modeMap: Record<string, string> = { l1_l2: 'noreng', l2_l1: 'engnor', def_l1: 'defnor' };
  localStorage.setItem('vocab-flashcard-mode', modeMap[effectiveCardDirection] ?? 'noreng');
  // ...unchanged lines...
  localeStore.set(uiLanguage);
  languageStore.set(flashcardLanguage); // new
}
```

Two new message keys needed in `messages/en.json` (and every locale file):
`profile_prefs_flashcard_language` ("Flashcard language") and
`profile_prefs_flashcard_language_hint` (short explanatory line, e.g. "The
language your flashcards are translated into."). The three old
`profile_prefs_card_direction_no_en` / `_en_no` / `_def_no` keys become
unused once labels are built dynamically — safe to delete from all message
files as a cleanup pass, but not load-bearing if left in place.

---

## 12. `src/routes/my-profile/+page.server.ts`

`updatePreferences` action: widen `validLanguages`, rename `validDirections`,
read+validate the new `flashcard_language` field, and **delete the buggy
redirect** entirely.

```ts
const validLanguages = ['en', 'nb', 'es', 'uk'];
const validFlashcardLanguages = ['english', 'spanish', 'ukrainian'];
const validDirections = ['l1_l2', 'l2_l1', 'def_l1'];

// ...
const flashcard_language = data.get('flashcard_language') as ProfileUpdate['flashcard_language'];

if (flashcard_language && !validFlashcardLanguages.includes(flashcard_language)) {
  return fail(422, { field: 'flashcard_language', message: 'Invalid flashcard language.' });
}

const update: ProfileUpdate = {
  ...(current_level && { current_level }),
  ...(ui_language && { ui_language }),
  ...(flashcard_language && { flashcard_language }), // new
  ...(card_direction && { card_direction })
  // ...unchanged...
};

const { error } = await upsertProfile(locals.supabase, locals.user.id, update);
if (error) {
  return fail(500, { field: 'preferences', message: 'Failed to save. Please try again.' });
}

// The `if (ui_language === 'nb') redirect(302, '/nb/my-profile')` block that
// used to sit here is removed — there is no /nb/my-profile route, switching
// language already updates this page in place via localeStore + paraglide's
// cookie strategy, and the redirect was dead-end behavior left over from an
// earlier URL-prefix assumption that was never actually correct.

return { success: true, action: 'updatePreferences' };
```

---

## 13. `src/lib/components/OnboardingSlides.svelte`

### Slide layout change

Per decision 9, the native-language, other-languages, and country slides are
removed outright — not replaced with a new Flashcard-language slide as
originally planned. `flashcard_language` becomes a side effect of slide 1's
UI-language choice instead, so no dedicated slide is needed for it.

| #   | Before (6 slides)              | After (3 slides)                                                                                                |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1   | UI language (2 buttons) + name | UI language (**dropdown**, all 4) + name — also sets a default `flashcard_language`                             |
| 2   | Native language                | _(removed — decision 9)_                                                                                        |
| 3   | Other languages                | _(removed — decision 9)_                                                                                        |
| 4   | Norwegian level                | Norwegian level (was 4) — also nudges `card_direction` to `def_l1` if UI language is Norwegian and level is B1+ |
| 5   | Study goals                    | Study goals (was 5)                                                                                             |
| 6   | Country                        | _(removed — decision 9)_                                                                                        |
| 7   | Completion                     | Completion (was 7)                                                                                              |

`TOTAL` goes from `6` to `3`; `Slide` type becomes `1 | 2 | 3 | 4` (completion
is slide 4). Deleted entirely: the local ~40-entry `LANGUAGES` ISO-code array
(used only for the native-language dropdown, and a naming collision with the
unrelated `LANGUAGES` export from `$lib/config` that this section now
imports instead), `COUNTRIES`, `OTHER_CODE`, `nativeLanguage`,
`nativeLanguageOther`, `otherLanguages`, `otherLangOptions`,
`toggleOtherLang`, `country`, and the `ipCountry` prop.

### New state — default flashcard language from UI language

```ts
import { LANGUAGES, languageEntryForLocale } from '$lib/config';
import type { FlashcardLanguage } from '$lib/types';
import { languageStore } from '$lib/stores/language.svelte';
import { localeStore } from '$lib/localeStore.svelte';

// flashcard_language is derived, not asked: it mirrors whichever LANGUAGES
// key matches the chosen UI-language code, except 'norwegian' (not a valid
// flashcard language) which falls back to 'english'.
function defaultFlashcardLanguage(localeCode: string): FlashcardLanguage {
  const entry = languageEntryForLocale(localeCode);
  const key = entry?.[0];
  return key && key !== 'norwegian' ? (key as FlashcardLanguage) : 'english';
}

let flashcardLanguage = $state<FlashcardLanguage>(defaultFlashcardLanguage(localeStore.current));
```

### Slide 1 — dropdown instead of two buttons

```svelte
<div class="flex gap-2" role="group" aria-label={m.onboarding_s1_lang_label()}>
  <select
    bind:value={localeStore.current}
    onchange={(e) => {
      const code = (e.target as HTMLSelectElement).value;
      switchLocale(code);
      flashcardLanguage = defaultFlashcardLanguage(code);
    }}
    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm ..."
  >
    {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
      <option value={code}>{flag} {name}</option>
    {/each}
  </select>
</div>
```

(`switchLocale()` already exists in this file and already PATCHes
`/api/profile/language` — unchanged, just driven by a `<select>` now instead
of two `<button>`s.)

### `next()` / `canAdvance()`

```ts
// next():
if (current === 1) {
  await patch({ display_name: displayName.trim(), flashcard_language: flashcardLanguage });
  languageStore.set(flashcardLanguage); // already in effect before the user reaches a flashcard page
} else if (current === 2) {
  // was current === 4 (Norwegian level) — same body, plus one addition:
  const patchBody: Record<string, unknown> = { current_level: currentLevel };
  // Nudge toward the monolingual Norwegian-definition card mode for B1+
  // users who also chose a Norwegian UI — see decision 9.
  if (localeStore.current === 'nb' && currentLevel !== 'A1' && currentLevel !== 'A2') {
    patchBody.card_direction = 'def_l1';
  }
  await patch(patchBody);
} else if (current === 3) {
  // was current === 5 (Study goals) — unchanged body
  await patch({ study_goals: studyGoals });
  if (!error) {
    current = 4; // completion screen
    return;
  }
}

// canAdvance():
if (current === 1) return displayName.trim().length > 0;
if (current === 2) return currentLevel.length > 0;
if (current === 3) return studyGoals.length > 0;
```

The Norwegian-level and study-goals slide markup is otherwise unchanged —
only their slide numbers and `current === N` branch numbers shift down. The
completion screen (now slide 4) is unchanged except for its number.

### Cleanup this implies elsewhere

- `+layout.server.ts`'s `ipCountry` computation (the `x-vercel-ip-country`
  header read) can be deleted — nothing consumes it once the country slide
  is gone.
- `messages/*.json` keys `onboarding_s2_*` (native language), `onboarding_s3_*`
  (other languages), and `onboarding_s6_*` (country) become unused and can
  be deleted. The reused keys (`onboarding_s4_*`/`onboarding_s5_*`/
  `onboarding_s7_*` for level/goals/completion) don't need renaming to match
  their new slide numbers — they're just message-key names, not
  user-visible text; only `TOTAL` (used by `m.onboarding_step(...)`) needs
  to be correct, which the state change above already handles.
- `api/profile/onboarding/+server.ts`'s validation for `native_language`,
  `other_languages`, and `country` can be left in place defensively (the
  columns still exist) or removed — neither is load-bearing for this plan.

---

## 14. `src/lib/VocabFlashcardPage.svelte` — fix the `makeDeckItem` bug

`makeDeckItem()` currently hardcodes `entry.english` / `entry.example_english`
for word and phrase cards, ignoring the `language` prop entirely — this is
why picking a flashcard language today has no visible effect. Fix:

```ts
function makeDeckItem(entry: VocabEntry, mo: Mode, ct: CardType): DeckItem {
  if (ct === 'phrase') {
    const translation = getExampleTranslation(entry, language) ?? entry.example_english;
    return {
      entry,
      front: mo === 'noreng' ? entry.example : translation,
      back: mo === 'noreng' ? translation : entry.example
    };
  }
  if (mo === 'defnor') {
    return {
      entry,
      front: entry.definition ?? getTranslation(entry, language),
      back: entry.norsk
    };
  }
  const translation = getTranslation(entry, language);
  return {
    entry,
    front: mo === 'noreng' ? entry.norsk : translation,
    back: mo === 'noreng' ? translation : entry.norsk
  };
}
```

Also widen the `language` prop's type from `Language` to `FlashcardLanguage`
(it already defaults to `'english'`, which is valid for both types, so this
is a type-only tightening — Norwegian can no longer be passed here even by
mistake):

```ts
interface Props {
  entries: VocabEntry[];
  title?: string;
  language?: FlashcardLanguage; // was Language
  // ...
}
```

`deriveExample`/`deriveExampleTranslation` (already updated per
`multi-language.md`) don't need further changes beyond this type tightening
— they already call `getTranslation`/`getExampleTranslation` correctly.

---

## 15. `src/routes/[level]/[category]/+page.svelte`

This is the missing link — `languageStore` is never read here today, so
`VocabFlashcardPage` always falls back to its `'english'` default regardless
of what's stored. Wire it through:

```svelte
<script lang="ts">
  import { VocabFlashcardPage } from '$lib';
  import { languageStore } from '$lib/stores/language.svelte';
  import { removeHyphensAndCapitalize } from '$lib/utils';

  let { data } = $props();
  let categoryName = $derived(removeHyphensAndCapitalize(data.category));
  // ...
</script>

<VocabFlashcardPage
  entries={data.entries}
  title={categoryName}
  level={data.level}
  language={languageStore.current}
  prevCategory={data.prevCategory}
  nextCategory={data.nextCategory}
/>
```

For logged-in Plus users, `languageStore.current` is currently seeded only
from localStorage (per §7), not from `profile.flashcard_language`. If you
want true cross-device flashcard-language sync on first load (the same way
`showExample`/`sessionLimit` already arrive via `+layout.server.ts`'s
`page.data`), add `flashcard_language` to that query and seed
`languageStore` from it on mount the same way `VocabFlashcardPage` already
seeds `showExampleDefault` from `page.data.showExample` — worth doing, but
it's an additive follow-up, not a blocker for the rest of this plan.

---

## 16. `project.inlang/settings.json`

```json
{
  "baseLocale": "en",
  "locales": ["en", "nb", "es", "uk"]
}
```

After this change (and once `messages/es.json` / `messages/uk.json` exist —
already produced by `scripts/translate-messages.mjs` from the earlier
session), restart `pnpm dev` (or run `pnpm build`) so the paraglide Vite
plugin regenerates `src/lib/paraglide/runtime.js` and `messages.js` with the
new `locales` array and `/es/`, `/uk/` URL patterns. Those URL patterns are
generated automatically but are currently inert — the active strategy list
(`cookie, globalVariable, baseLocale`) doesn't include `"url"`, so `/es/...`
paths won't be the actual switching mechanism; the cookie + `localeStore`
combination (already in place) remains how language switching works. No
further routing changes are needed beyond removing the bug in §12.

If a future language is added to `LANGUAGES` purely for flashcard-data
translation _before_ its UI strings are translated, don't add its code to
this file yet — the Nav/Preferences/Onboarding interface-language dropdowns
in §8/§11/§13 iterate `LANGUAGES` directly today (all four currently have a
message file), so a language added to `LANGUAGES` without a matching
`messages/<code>.json` would show an empty UI when selected. Worth revisiting
with a `hasUiTranslation` flag on `LANGUAGES` entries if/when that happens;
not needed for Spanish/Ukrainian today since both get full UI translation.

---

## Pending Work

| Item                                                                                                                                                       | File(s)                                       | Status  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------- |
| `LANGUAGES` gains `code`; add `FLASHCARD_LANGUAGES`                                                                                                        | `config.ts`                                   | ✅ Done |
| `VocabEntry.spanish`/`ukrainian` → optional; widen `Language`/`Profile` types                                                                              | `types.ts`                                    | ✅ Done |
| `getTranslation`/`getExampleTranslation` fallback + narrower param type                                                                                    | `vocab-helpers.ts`                            | ✅ Done |
| Migration: widen `ui_language`, add `flashcard_language`, generalize `card_direction`                                                                      | `supabase/migrations/020_*.sql`               | ✅ Done |
| `Profile`/`ProfileUpdate` types                                                                                                                            | `server/profile.ts`                           | ✅ Done |
| `Locale` derived from `LANGUAGES[*].code`                                                                                                                  | `localeStore.svelte.ts`                       | ✅ Done |
| Validity check uses `FLASHCARD_LANGUAGES`                                                                                                                  | `stores/language.svelte.ts`                   | ✅ Done |
| Toggle button → dropdown                                                                                                                                   | `routes/components/Nav.svelte`                | ✅ Done |
| Widen locale validation                                                                                                                                    | `api/profile/language/+server.ts`             | ✅ Done |
| Accept `flashcard_language`                                                                                                                                | `api/profile/onboarding/+server.ts`           | ✅ Done |
| Interface + Flashcard-language dropdowns; dynamic card-direction labels                                                                                    | `my-profile/PreferencesSection.svelte`        | ✅ Done |
| Widen validation; **remove the `/nb/my-profile` redirect bug**                                                                                             | `my-profile/+page.server.ts`                  | ✅ Done |
| Drop native-language/other-languages/country slides; slide 1 → dropdown that also sets default `flashcard_language`; renumber to 3 slides + completion (4) | `components/OnboardingSlides.svelte`          | ✅ Done |
| Fix `makeDeckItem` to actually use `language` prop                                                                                                         | `VocabFlashcardPage.svelte`                   | ✅ Done |
| Pass `language={languageStore.current}`                                                                                                                    | `[level]/[category]/+page.svelte`             | ✅ Done |
| Add `es`, `uk` to `locales`                                                                                                                                | `project.inlang/settings.json`                | ✅ Done |
| Add `profile_prefs_flashcard_language(_hint)`; remove unused `profile_prefs_card_direction_no_en/en_no/def_no`; add onboarding slide-3 strings             | `messages/*.json`                             | ✅ Done |
| Spanish/Ukrainian data for B1 vocab + uttrykk                                                                                                              | `data/vocab-b1.json`, `data/uttrykk-b1*.json` | ✅ Done |

---

## Adding a New Language in Future

1. Add an entry to `LANGUAGES` in `config.ts` (`name`, `flag`, `code`).
2. If it should also be an _interface_ language: add `messages/<code>.json`
   (via `scripts/translate-messages.mjs --language <key>`), add the code to
   `project.inlang/settings.json`'s `locales`, and widen the
   `profiles_ui_language_check` constraint.
3. If it should also be a _flashcard_ language: it's automatically included
   in `FLASHCARD_LANGUAGES` (everything except `norwegian` is), so widen
   `profiles_flashcard_language_check`, add `<lang>?`/`example_<lang>?`
   fields to `VocabEntry`, and translate the vocab/uttrykk JSON files.
4. No component changes needed in either case — Nav, Preferences, and
   Onboarding all iterate `LANGUAGES`/`FLASHCARD_LANGUAGES` dynamically.
