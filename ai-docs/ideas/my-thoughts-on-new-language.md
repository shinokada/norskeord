# New Languages

For now we are going to add Spanish and Ukrainian. However this should be future proof when I add new languages in future.

```ts
// from src/lib/config.ts
export const LANGUAGES = {
  norwegian: { name: 'Norwegian', flag: '🇳🇴' },
  english: { name: 'English', flag: '🇬🇧' },
  spanish: { name: 'Spanish', flag: '🇪🇸' },
  ukrainian: { name: 'Ukrainian', flag: '🇺🇦' }
} as const;
```

## Top navigation switcher for Interface language

Use a dropdown to select
At the beginning: Default English -> onBoarding choice should update Preference (Interface language).
When user changes it should update Preferences Interface language

## Flashcard language switcher

Default English and onBoarding choice update Preference (Flashcard language)

## onBoarding language slide

- Interface language (this can be auto-selected from mother tongue if it is one of languages from config) Use a dropdown to select
- Flashcard language (this can be auto-selected from mother tongue if it is one of languages from config) Use a dropdown to select

## Preference

### Interface language

Use a dropdown to select and this should change top nav language switcher

### Flashcard language

Use a dropdown to select and this should change the flashcard language switcher (selected language -> Norwegian, Norwegian -> selected language) and flashcard language

### Card direction

Norwegian → onboard choice then (above selected language, dynamic)
onboard choice then (above selected language, dynamic) → Norwegian

## Supabase DB update script

Do I need this?

---

## Chats

Q: I had to stop thinking about preference, onboarding, flashcard language and navigation (UI) language and created ai-docs/implementation/new-languages.md (now changed to this document).
Now I want you to read it and ask me questions if you have before writing implementation plan in new-languages.md.

Ans:
Found both files. Let me read them, plus the relevant onboarding/profile docs they reference.There's a `localeStore.svelte.ts` and `lib/paraglide` — that's likely the actual interface-language mechanism (separate from `stores/language.svelte.ts`). Let me check it plus the components directory and onboarding/profile files.Let me check one more thing — the Supabase schema constraints — so I don't ask you something I can find myself.I've now read `multi-language.md`, `new-languages.md`, and the actual code: `config.ts`, `types.ts`, `vocab-helpers.ts`, `stores/language.svelte.ts`, `localeStore.svelte.ts`, `Nav.svelte`, `OnboardingSlides.svelte`, `PreferencesSection.svelte`, `server/profile.ts`, the `/api/profile/language` and `/api/profile/onboarding` routes, `my-profile/+page.server.ts`, `VocabFlashcardPage.svelte`, the paraglide runtime, and the `profiles` table schema + migrations. Before I write the plan into `new-languages.md`, I need you to settle a few things that change how big this refactor gets.

**1. Two separate "language" vocabularies.** `LANGUAGES` in `config.ts` uses full-name keys (`norwegian`/`english`/`spanish`/`ukrainian`) because that's also the vocab-JSON field-naming convention (`entry.spanish`, `example_ukrainian`, etc.). Interface language is driven by an entirely different string space — paraglide locale codes (`en`/`nb`, soon `es`/`uk`) via `localeStore`. To drive one dropdown for each from a single config, I'd add a `code` field to every `LANGUAGES` entry (e.g. `spanish: { code: 'es', ... }`) to bridge the two. OK with that approach?

**2. Should "Norwegian" be pickable as a Flashcard language?** `LANGUAGES` already has a `norwegian` entry (added since `multi-language.md` was written). That's needed for Interface language, but translating Norwegian↔Norwegian for flashcards is meaningless. I'll exclude `norwegian` from the Flashcard-language dropdown only — flag if you meant something else by adding it.

**3. How far should Interface-language expansion go?** `ui_language`/`localeStore`'s `Locale` type is hardcoded to `'en'|'nb'` in five places: the `Profile` TS type, the `profiles.ui_language` Postgres CHECK constraint, `/api/profile/language`'s validation, `updatePreferences`'s `validLanguages` array, and `localeStore.svelte.ts`. The nav button and onboarding slide 1 are also literal two-button toggles, not dropdowns. Confirm I should generalize all of this (dropdown + a Supabase migration widening the CHECK constraint) rather than special-casing es/uk.

**4. Card direction + where Flashcard language is stored.** `card_direction` is a fixed 3-way enum (`no_en`/`en_no`/`def_no`) in a CHECK constraint, and `languageStore` (the flashcard language itself) isn't persisted to the profile at all — it's localStorage-only, so it won't sync cross-device for Plus users like every other preference does. Two ways to fix both: (a) add a `flashcard_language` column and generalize `card_direction` to language-agnostic values (`l1_l2`/`l2_l1`/`def_l1`), migrating `no_en→l1_l2` etc. and backfilling `flashcard_language='english'`; or (b) leave `card_direction`'s existing values alone (their English-flavored names get slightly misleading once Spanish is selected, but no data migration) and just add `flashcard_language` alongside it. I lean toward (a) for cleanliness — is a migration touching every existing row acceptable, or keep it minimal?

**5. Onboarding slide layout.** Today: slide 1 = UI-language toggle + name, slide 2 = native language, slide 3 = other languages, slide 4 = Norwegian level, slide 5 = goals, slide 6 = country (`TOTAL = 6`). Auto-selecting Interface/Flashcard language from native language only works _after_ slide 2. Should I insert a new slide after native language carrying both dropdowns (bumping `TOTAL` to 7, simplifying slide 1 to just the name), or upgrade slide 1's toggle to a dropdown in place and add Flashcard language as its own new slide right after native language?

**6. Data coverage gap for B1+.** Per `multi-language.md`'s table, only `vocab-a1`/`vocab-a2` get `spanish`/`ukrainian` fields — B1 through C stay Norwegian/English-only by design. If Flashcard language is set to Spanish and a B1 category opens, `getTranslation()` returns `undefined`. Silently fall back to English (cheap, but the direction label still says "Norsk → Español" while showing English), or hide/disable the Flashcard-language picker above A2 until that data exists?

**7. A bug I found — confirm it's in scope.** `makeDeckItem()` in `VocabFlashcardPage.svelte` still hardcodes `entry.english`/`entry.example_english` for word/phrase card fronts and backs, never calling `getTranslation`/`getExampleTranslation`, even though the mode-button labels right above it already say `Norsk → {LANGUAGES[language].name}` dynamically. And no route ever passes a `language` prop — `[level]/[category]/+page.svelte` doesn't read `languageStore` at all. So today, picking any language does nothing visible. I'll treat fixing this wiring as core to the plan unless you tell me otherwise.

**8. URL routing for new locales.** Paraglide auto-generates `/nb/...` prefixes from `project.inlang/settings.json`'s `locales` array, and `+page.server.ts` has a hardcoded `if (ui_language === 'nb') redirect(302, '/nb/my-profile')`. Adding `es`/`uk` there will produce `/es/...`/`/uk/...` routes automatically — should the plan generalize that redirect (and any sitemap/hreflang work) for all locales, or should Spanish/Ukrainian UI work via cookie-only switching without URL prefixes for now?

Q: 1. Yes it is ok. 2. Exclude Norwegian from flashcard language in Preference and onboarding. 3. You can generalize all 4. I prefer (a) for cleanliness 5. upgrade slide 1's toggle to a dropdown in place and add Flashcard language as its own new slide right after native language 6. I am adding Spanish and Ukrainian to vocal-b1.json, uttrykk-b1-preview.json and uttrykk-bi.json, so do not hide/disable the Flashcard-language picker 7. Yes, it's a bug please fix it. 8. if (ui_language === 'nb') redirect(302, '/nb/my-profile') is not correct. It is a bug. The /nb/my-profile path should be removed. Currently when user changes language in the top navigation, /my-profile page language changes.

Can you now write a implementation plan or do you have more questions?

Ans: (Updated ai-docs/implementation/new-languages.md)
