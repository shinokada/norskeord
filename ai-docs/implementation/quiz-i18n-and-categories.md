# Quiz language fields + category label i18n

## Background

Three related issues raised across two sessions, all about English leaking
into places that should be Norwegian-first or properly localized:

1. `category` (`src/lib/config.ts` `CATEGORIES_BY_LEVEL`) is a stable slug —
   used as a URL segment (`/a2/shopping`), a `PLUS_CATEGORIES`/
   `FREE_QUIZ_CATEGORIES` Set key, a field on every vocab/uttrykk entry, and
   the `CardProgress.category` key persisted in `localStorage`/Supabase.
   Renaming these slugs to Norwegian would break saved progress, live URLs,
   and every consumer that matches against them (tests, scripts, admin,
   `progress-report`) for a purely cosmetic win. **Decision: URL slugs stay
   English, unchanged.**
2. Quiz questions (`src/lib/quiz.ts`) show English prompts/options even
   though `VocabEntry` already carries `spanish`/`ukrainian`/`german` fields
   and B2/C already quiz monolingually via `definition`.
3. The vocab/uttrykk flashcard page header is locale-inconsistent: the
   plain vocab page (`/a1/greetings`) shows the raw English slug
   title-cased regardless of locale, while the uttrykk-with-theme page
   (`/a1/uttrykk?theme=greetings`) correctly shows a translated breadcrumb
   — but only because it happens to use a different, already-locale-aware
   lookup that the plain vocab page never calls.

Verified directly against the current source (not just prior sessions'
notes, which had drifted in places — see Phase 2 and Phase 3):

- `getTranslation(entry, language)` / `getExampleTranslation` already exist
  in `src/lib/vocab-helpers.ts` and already handle the
  Spanish/Ukrainian/German/English fallback-to-English lookup.
  `VocabFlashcardPage.svelte` already takes a `language: FlashcardLanguage`
  prop and uses these — flashcards already solved this problem.
- `quiz.ts` is **not** uniformly hardcoded to `entry.english` — it already
  has a monolingual path for B2/C (`isMonolingualLevel`, `isQuizable`,
  `getDistractors`, all three question builders) that prefers
  `entry.definition` over English, per `quiz-c-monolingual.md`. The actual
  gap is narrower than first described: **A1/A2/B1 (non-monolingual
  levels) always use `entry.english`**, with no `language` param at all.
- `src/routes/quiz/+page.svelte` has three more hardcoded `.english` reads
  outside `quiz.ts` itself: the fill-question translation line, the
  `example_english` line under the example sentence, and the summary
  results list — all guarded by `isMonolingualLevel(...)` for B2/C already,
  but falling straight to `.english` otherwise.
- The interface locale (`localeStore`, backed by Paraglide) only covers
  `nb`/`en`/`es`/`uk` — there is no `de` interface locale. **Correction from
  a later pass:** flashcards do _not_ actually derive their quiz/flashcard
  translation language from `localeStore` at all. `VocabFlashcardPage`'s
  `language` prop is fed by a separate, dedicated `languageStore`
  (`src/lib/stores/language.svelte.ts`), persisted under its own
  `localStorage` key (`norskeord-language`) independent of the `locale` key
  `localeStore` uses. `languageStore`'s type is `FlashcardLanguage`, sourced
  from `FLASHCARD_LANGUAGES` (all of `LANGUAGES` minus `norwegian`), which
  already includes German — so German flashcard/quiz translation already
  works today, end to end, with no interface-locale limitation. This
  resolves the German open question below and means Phase 1's
  `quiz/+page.svelte` change (which derived `quizLanguage` from
  `localeStore.current`) used the wrong store — see the Phase 1 status note.
- `VocabFlashcardPage` already gates a Norwegian-monolingual mode
  (`defnor`) to `B1_PLUS_LEVELS` (B1/B2/C) via `isDefnorLevel`, and disables
  it for A1/A2. This existing level cutoff is the basis for the Phase 1
  decision below — quiz should not go monolingual anywhere flashcards
  themselves treat that as premature.
- `progress-report/+server.ts`'s `CATEGORY_LABELS` map has drifted more than
  the prior session's spot-check found. Comparing it against the live
  `CATEGORIES_BY_LEVEL` in `config.ts`:
  - A1 actually uses `adjectives`/`verbs` (not `basic-adjectives`/
    `basic-verbs`), and several A1 slugs (`household-items`, `places`,
    `clothes`, `actions`, `prepositions`, `housing`) have no label entry at
    all.
  - A2 uses `health` (not `health-basic`); `social-life`, `money` have no
    label entry.
  - B1 has ~15 slugs with no label entry (`expressing-opinions`,
    `accommodation`, `finance`, `personal-growth`, `reasoning`, `society`,
    `communication-skills`, `urban-life`, `fitness`, `sustainability`,
    `science-nature`, `journalism`, `healthcare`, `language-learning` is the
    only B1 slug that happens to match).
  - **C is almost entirely unlabeled** — of C's 37 category slugs, none
    match a `CATEGORY_LABELS` key.
  - `labelFor()`'s auto-title-case fallback means none of this is currently
    broken (a C category just shows as e.g. "Formal Writing" instead of a
    curated label), but it confirms hand-maintaining this map is the actual
    bug, not a couple of stale entries.
- `messages/*.json` (nb/en/es/uk/de) already has `category_a1_greetings`,
  `category_a1_uttrykk`, etc. — i.e. `category_${level}_${slug}` keys for
  every A1–B2 slug already exist and are already consumed by `themeLabel()`
  in `[level]/[category]/+page.svelte`, which is exactly how the uttrykk
  breadcrumb renders correctly today. The plain vocab h1 in the same file
  never calls this — it does `categoryName =
removeHyphensAndCapitalize(data.category)` instead, which is the actual
  bug (a raw-slug fallback, not a missing i18n feature). C's later slugs
  (`nature-landscape` onward) are missing `category_c_*` keys.
- `quiz/+page.svelte`'s `formatCategory()` has the same bug as the vocab h1
  above: it title-cases the raw slug instead of using the
  `category_${level}_${slug}` keys, except for `uttrykk`, which it
  special-cases via `m.quiz_category_uttrykk()` — which is why today's
  category picker shows "Uttrykk (Фрази)" translated but every other
  category in English.

## Goal

1. **Quiz language**: A1/A2 quiz questions (prompts, MC options,
   distractors) use the learner's chosen translation language
   (Spanish/Ukrainian/German/English) via the same `getTranslation` helper
   flashcards already use, instead of always English. B1 additionally gets
   the option to quiz Norwegian-monolingual (via `definition`) for any
   category where `hasDefinitions` is true, mirroring the same cutoff
   flashcards already use for `defnor` mode — B1 is not forced into either
   mode, both are enabled and consistent with flashcards. B2/C stay
   monolingual-only (unchanged, already correct).
2. **Category labels (content)**: one generated, multilingual
   `CATEGORY_LABELS` source, covering every slug in `CATEGORIES_BY_LEVEL`
   with no manual drift possible, consumed by `progress-report`, the quiz
   category picker, and anywhere else that currently hand-rolls a label —
   **without renaming any stored `category` value**. Category names (as
   opposed to interface chrome — see Phase 3) are locale-driven, not fixed
   Norwegian: a beginner in a non-Norwegian locale needs to recognize "the
   category about food" without already knowing `mat` means food, which is
   the whole point of a translated picker at A1/A2.
3. **Flashcard header consistency**: the vocab/uttrykk flashcard page header
   uses one mechanism everywhere instead of two (one locale-aware, one not).
   `title` (the `A1 · X` line) stops meaning "which category" and becomes a
   fixed, always-Norwegian mode label — `Ord` for word decks, `Uttrykk` for
   phrase decks — since that's interface chrome describing _what kind of
   deck this is_, not content the learner is trying to decode. The specific
   category name moves to a `Studying: X` breadcrumb, shown on every
   category page (not just uttrykk-with-theme as today), using the same
   locale-driven `category_${level}_${slug}` lookup as the quiz picker in
   Goal 2 — so a category's name is looked up the same way and shown the
   same way everywhere in the app.

## Non-goals

- No change to any stored `category` slug, `PLUS_CATEGORIES`/
  `FREE_QUIZ_CATEGORIES` keys, `CardProgress.category`, or URL structure.
- No change to B2/C quiz behavior — monolingual-via-`definition` stays as
  is.
- No new `hint` field on `VocabEntry`. As discussed, quiz "hints" today are
  just the translation shown as the prompt/options — that's what Phase 1
  below already produces once wired to a chosen language, so no separate
  field is needed.
- Not a rewrite of `getTranslation`/`getExampleTranslation` — Phase 1 reuses
  them as-is.
- No change to `VocabFlashcardPage`'s existing `defnor`/`isDefnorLevel`
  flashcard logic itself — Phase 1's B1 quiz option mirrors that cutoff, it
  doesn't touch it.

## Phase 1 — Quiz language param ✅ Done

- Add `language: FlashcardLanguage = 'english'` to `buildMCQuestion`,
  `buildFillQuestion`, `buildTypeQuestion`, `getDistractors`, and
  `buildQuizSession` in `src/lib/quiz.ts`. ✅ Done
- Inside each, for the **non-monolingual** branch, swap the direct
  `entry.english` / `d.english` reads for `getTranslation(entry, language)`
  / `getTranslation(d, language)` (imported from `$lib/vocab-helpers`). The
  B2/C monolingual branch is untouched — it already ignores `english` in
  favor of `definition`. ✅ Done
- Extend the monolingual condition so B1 categories where
  `hasDefinitions` is true (the same check `isDefnorLevel`/flashcards use)
  can also take the `definition`-based branch, instead of that branch being
  hardcoded to B2/C only. B1 categories without definitions fall back to
  the translation-based branch like A1/A2. ✅ Done — added
  `isB1MonolingualEligible(entry, categoryHasDefinitions)` in `quiz.ts` and
  a `monolingualOverride` param threaded through `getDistractors`/
  `buildMCQuestion`/`buildFillQuestion`/`buildTypeQuestion`;
  `buildQuizSession` computes `categoryHasDefinitions` once from its entry
  pool and passes the per-entry override down.
- `buildFillQuestion`'s no-blank-found fallback string
  (`Hva er det norske ordet for "${entry.english}"?`) also needs the same
  swap so the fallback prompt matches the chosen language. ✅ Done
- In `src/routes/quiz/+page.svelte`, derive a `FlashcardLanguage` from
  `localeStore.current` (map `en → english`, `es → spanish`, `uk →
ukrainian`; `nb` has no sensible translate-into-Norwegian-from-Norwegian
  meaning, so it falls back to `english`, matching the existing implicit
  default) and thread it into `buildQuizSession`. ✅ Done — **and
  corrected.** Initially implemented against `localeStore` as planned here,
  then fixed once a later pass found flashcards actually use a separate,
  dedicated `languageStore` (`src/lib/stores/language.svelte.ts`,
  independent of the interface locale). `quiz/+page.svelte` now reads
  `languageStore.current` directly — no interface-locale mapping needed,
  and German (already supported by `languageStore`/`FLASHCARD_LANGUAGES`)
  is now reachable in quiz for free. The `localeStore` import was removed
  entirely from the file.
- Fix the three remaining hardcoded `.english` reads in `+page.svelte` (fill
  question's translation line, the `example_english` line, and the summary
  list) to use the same derived language via `getTranslation`/
  `getExampleTranslation` instead of a direct field access. ✅ Done
- No data changes — every field these read from already exists on
  `VocabEntry`, with `getTranslation`'s existing fallback-to-English
  covering any entry where a given language is missing. ✅ Done (no data
  changes were needed)

**Not yet done / verify next:** `quiz.test.ts` wasn't run from this session
(no test-runner access to your machine from here) — the new params all
default to the prior behavior (`language: 'english'`, `monolingualOverride:
false`), so existing calls in the test file should still pass unchanged,
but worth running `npm run test` (or your usual vitest command) to confirm
before moving on to Phase 2.

## Phase 2 — Centralized category labels ✅ Done

- Add a generated map (script or a one-time build step) that walks
  `CATEGORIES_BY_LEVEL` and produces `{ [slug]: { nb, en, es, uk, de } }` for
  every slug across all five levels — so it's impossible for a slug to exist
  without a label, unlike today's hand-maintained `CATEGORY_LABELS`. ✅ Done
  — see the extend-Paraglide-keys decision below instead of a new source.
- **Decided:** extend the existing `category_${level}_${slug}` Paraglide
  keys rather than a new plain-object source (`src/lib/category-labels.ts`).
  Reusing the working `themeLabel()` mechanism means one lookup shared by
  `progress-report`, the quiz picker, and Phase 3's breadcrumb, plus
  `scripts/check-message-keys.mjs`-style missing-key checks for free — a
  parallel plain-object source would just be a second system to keep in
  sync with no forcing function. The remaining cost either way is the same:
  filling in ~110 missing keys × 5 languages for C's later slugs. ✅ Done —
  the shared lookup lives as `categoryLabel(level, slug)` in
  `src/lib/vocab-helpers.ts`, reading `category_${level}_${slug}` (hyphens
  in the slug are translated to underscores for the generated Paraglide
  function name) with a `removeHyphensAndCapitalize` fallback for any slug
  that's genuinely missing a key.
- Fill in the missing `category_c_*` keys (C's later slugs, from
  `nature-landscape` onward, currently have none). ✅ Done — all 37 C slugs
  now have real translations in all 5 locale files. Verified by diffing
  every locale file's keys against `CATEGORIES_BY_LEVEL` programmatically
  (all levels, not just C) — this also caught two keys the original C
  audit missed: `category_a1_prepositions` and `category_a1_housing` were
  missing from all 5 locales (an A1 gap, not a C one). Added with
  translations (en: Prepositions/Housing, nb: Preposisjoner/Bolig, es:
  Preposiciones/Vivienda, uk: Прийменники/Житло, de:
  Präpositionen/Wohnen). Re-verified afterward: 0 missing keys across all 5
  levels × 5 locales. Note: the generated `src/paraglide/messages/*.js`
  files (gitignored build output) won't reflect these until the next
  `npm run dev`/build regenerates them from `messages/*.json` — no action
  needed, just don't be surprised if `category_c_*`/the two new A1 keys
  aren't in `src/paraglide` yet.
- Update `progress-report/+server.ts` to import from this single source
  instead of its local `CATEGORY_LABELS` object; drop the local map and
  `labelFor()`'s title-case fallback becomes the last resort only for a slug
  genuinely missing from `CATEGORIES_BY_LEVEL` (which shouldn't happen once
  Phase 2 covers every slug). ✅ Done — `CATEGORY_LABELS` map and `labelFor()`
  removed entirely; `CategoryStat.label` is built via `categoryLabel(card.level,
card.category)`.
- Point `quiz/+page.svelte`'s `formatCategory()` at the same
  `category_${level}_${slug}` lookup (dropping its raw title-case fallback
  and its special-cased `uttrykk` branch, since `uttrykk` becomes just
  another key in the same set) so the quiz category picker is fully
  i18n'd instead of English-with-one-exception. ✅ Done — `formatCategory()`
  is now a one-line call to `categoryLabel(selectedLevel, cat)`.
- Audit any other label-guessing call sites doing the same
  hyphen-replace-and-titlecase trick and point them at the same source, so
  a category's display name is consistent everywhere instead of
  re-derived per file. Phase 3's `Studying: X` breadcrumb (below) is one
  such call site and should use this exact lookup too. ✅ Done — found and
  fixed three more call sites:
  - `src/lib/stats.ts` — all 5 `StatRow`-building call sites (vocab category
    rows, uttrykk theme rows for both the C branch and the A1–B2 branch,
    including their "Others" rows) now call `categoryLabel()`.
  - `src/routes/learn/[level]/+page.svelte` — deleted its local
    byte-for-byte-duplicate `categoryLabel(level, slug)` function (which
    imported `removeHyphensAndCapitalize` directly) and now imports the
    shared one from `$lib/vocab-helpers`.
  - `src/lib/components/Search.svelte` — the search-result row's category
    tag was doing `entry.category.replace(/-/g, ' ')` (hyphens-to-spaces,
    no translation); now calls `categoryLabel(entry.level, entry.category)`.
  - Deliberately left as-is (confirmed intentional, not missed):
    `src/routes/[level]/[category]/+page.svelte`'s `themeLabel()` still has
    its own inline copy of the same lookup logic — this is explicitly
    Phase 3 territory (the `Studying: X` breadcrumb below reuses this exact
    spot), so it's left alone here rather than refactored twice. Admin
    pages (`admin/vocab`, `admin/uttrykk`) intentionally show raw category
    slugs in their tables/selects — that's correct for an editing UI, not a
    labeling bug.

## Phase 3 — Flashcard header: mode label vs. category breadcrumb ✅ Done

Today, two mechanisms exist for what should be one:

```
/a1/greetings  (uk locale)
┌─────────────────────────────┐
│         A1 · Greetings        │  ← categoryName = removeHyphensAndCapitalize('greetings')
│                               │     (raw slug, never translated — the bug)
└─────────────────────────────┘

/a1/uttrykk?theme=greetings  (uk locale)
┌─────────────────────────────────────────┐
│ Studying: Привітання (36) · Study all     │  ← themeLabel() → category_a1_greetings key (translated ✅)
│              A1 · Uttrykk                  │  ← categoryName = removeHyphensAndCapitalize('uttrykk')
│                                             │     (coincidentally "correct" only because the slug
│                                             │      itself happens to be the Norwegian word)
└─────────────────────────────────────────┘
```

Target — one mechanism, used on every category page:

```
/a1/greetings  (uk locale)
┌─────────────────────────────┐
│    Studying: Привітання       │  ← NEW: category_a1_greetings lookup (same as Phase 2), now shown here too
│           A1 · Ord             │  ← NEW: fixed mode label (this is a word deck), not the slug
└─────────────────────────────┘

/a1/greetings  (nb locale)
┌─────────────────────────────┐
│      Studying: Hilsener        │
│           A1 · Ord              │  ← same Norwegian word regardless of locale
└─────────────────────────────┘

/a1/uttrykk?theme=greetings  (uk locale)
┌─────────────────────────────────────────┐
│  Studying: Привітання (36) · Study all    │  ← unchanged, same lookup as always
│              A1 · Uttrykk                  │  ← now explicitly the mode label, not a slug coincidence
└─────────────────────────────────────────┘
```

- In `[level]/[category]/+page.svelte`, stop passing `categoryName`
  (`removeHyphensAndCapitalize(data.category)`) as `title` into
  `VocabFlashcardPage`. ✅ Done — `title` is no longer passed (or accepted;
  see below), and the local `categoryName` var was removed entirely,
  replaced by `studyingLabel` (see the unconditional breadcrumb item below).
- **Revised approach (was: static label keyed off `data.category`):** a
  later pass found that `VocabFlashcardPage`'s card-type toggle
  (`Ord`/`Frase`, i.e. word vs. phrase cards) is always visible, on every
  category including `uttrykk` itself — a learner on `/a1/greetings` can
  toggle to "phrase" and study example sentences as cards, and a learner on
  `/a1/uttrykk` can toggle to "word" and study the fixed expressions as
  single terms. So `data.category === 'uttrykk' ? … : …` (a URL/route-level
  check) answers the wrong question — the mode label needs to track
  `cardType`, which is component state that lives _inside_
  `VocabFlashcardPage`, not in the URL.
  - This means the `Ord`/`Uttrykk` label should be computed inside
    `VocabFlashcardPage` itself, from its own `cardType` state
    (`cardType === 'phrase' ? m.flashcard_mode_uttrykk() :
m.flashcard_mode_ord()`), rather than passed in as a static `title`
    prop from the parent route. ✅ Done — added a `modeLabel` `$derived` in
    `VocabFlashcardPage.svelte` right next to `effectiveMode`, and the
    header now renders `{level} · {modeLabel}` instead of `{level} ·
{title}`.
  - The two new Paraglide keys (`flashcard_mode_ord`/`flashcard_mode_uttrykk`)
    are still needed and still always render the fixed Norwegian words
    regardless of interface locale — they must be distinct from the
    existing `m.flashcard_word()`/`m.flashcard_phrase()` keys (used for the
    CardType toggle's own button labels), since those _do_ translate per
    locale today and would contradict the "always Norwegian" requirement
    for the header. ✅ Done — both keys added to all 5 locale files
    (`en`/`nb`/`es`/`uk`/`de`.json) with the identical value `"Ord"`/
    `"Uttrykk"` in every locale (unlike `flashcard_word`/`flashcard_phrase`,
    which do translate — nb's `flashcard_phrase` is even a different word,
    "Setning", confirming these needed to be genuinely separate keys, not a
    locale-specific override of the existing ones).
  - Before implementing, audit other call sites of `VocabFlashcardPage`
    (it's not only used from `[level]/[category]/+page.svelte`) to confirm
    none of them rely on `title` meaning "category name" in a way this
    change would break, and to settle what (if anything) the `title` prop's
    remaining role is once the mode label moves inside the component. ✅
    Done — audited via `$lib/index.ts`'s export list and a full scan of
    every `.svelte` route file; `VocabFlashcardPage` has exactly two
    consumers, `[level]/[category]/+page.svelte` and `c/uttrykk/+page.svelte`
    (the latter passed a static `title="Uttrykk"`, now removed). Decision:
    the `title` prop has no remaining role and was deleted from `Props`
    entirely, along with its `'Vocab'` default — the mode label fully
    replaces what it did in the header, and the category name now lives
    exclusively in the parent route's breadcrumb.
- Make the `Studying: X` breadcrumb unconditional instead of only rendering
  `{#if data.selectedTheme}`. When there's no theme filter active, fall back
  to the same `category_${level}_${slug}` lookup `themeLabel()` already
  wraps (i.e. Phase 2's centralized source), so every category page gets a
  translated breadcrumb, not just uttrykk-with-theme. ✅ Done —
  `[level]/[category]/+page.svelte` now always renders the breadcrumb;
  `studyingLabel` resolves `themeLabel(levelLower, data.selectedTheme ??
data.category)` so the plain-category case falls back to the category
  slug instead of only working when a `?theme=` filter is set. The existing
  `data.selectedTheme` branch (count + "Study all" link) is preserved
  unchanged for A1–B2 uttrykk-with-theme. C's separate `uttrykkContext`
  "💬 Includes N fixed expressions · Back to Uttrykk" note (Phase 8 of
  `uttrykk-category.md`) now renders _alongside_ the Studying breadcrumb
  instead of as a mutually-exclusive `{:else if}` branch, since it answers a
  different question ("does this category include idioms and how did I get
  here") than the breadcrumb does ("what category is this"). The
  now-orphaned no-entries fallback `<h1>{categoryName}</h1>` was updated to
  `<h1>{studyingLabel}</h1>` for the same reason `categoryName` was removed
  above. Also updated three e2e assertions in `e2e/flashcard.test.ts` that
  checked the flashcard h1 for a category name (A1 greetings, B1 travel, C
  philosophy) — they now assert on the `Studying: X` breadcrumb text
  instead, since the h1 is a fixed mode label after this change; a fourth,
  already-`test.fixme`'d C-uttrykk test was updated the same way for when it's
  re-enabled.

## Open questions

All three resolved (see the corresponding phase above for the decision and
rationale) — kept here as a log rather than deleted, since they document
why each decision was made:

- **Where should the generated category-label map live?** ✅ Resolved —
  extend the existing `category_${level}_${slug}` Paraglide keys (see
  Phase 2). Reuses `themeLabel()`'s proven mechanism and gets missing-key
  tooling for free instead of standing up a second, parallel source.
- **German quiz language.** ✅ Resolved — no decision needed. Flashcards
  already read their translation language from a dedicated `languageStore`
  (`src/lib/stores/language.svelte.ts`, independent of the interface-locale
  `localeStore`), which already includes German. Quiz now reads from the
  same store instead of deriving a language from the interface locale, so
  German is reachable with no new preference built. ✅ Fixed in
  `quiz/+page.svelte` (Phase 1 follow-up, done).
- **`Ord` vs. active card type.** ✅ Resolved — yes, it needs to track
  `cardType`, not the URL category. `VocabFlashcardPage`'s word/phrase
  toggle is available on every category page, uttrykk included, so a
  static label keyed off `data.category` would be wrong as soon as a
  learner toggles card type. See the revised Phase 3 plan above: the label
  moves into `VocabFlashcardPage` itself, computed from its own `cardType`
  state, pending an audit of the component's other call sites before
  implementation.
