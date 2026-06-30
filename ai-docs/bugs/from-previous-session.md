# i18n

ME: I need a mjs (or python) script to check if messages/nb.json uk.json es.json de.json has all the equivalant translation of en.json. I'd like to keep it in the scripts directory and run it from the project root. s it a good idea?

CLAUDE: Yes, that's a solid idea — a key-parity checker is a standard guard against exactly the kind of drift we just found (translations lagging behind `en.json`). Let me check the project structure first.There's already `check-language-sync.mjs` and `audit-translations.mjs` — let me check those before writing a new one, since they likely already do this.That checks something different (locale list consistency across config files). Let's check `audit-translations.mjs`.That audits vocab/uttrykk translation quality (using the API), not `messages/*.json` key parity. There's a real gap: no script checks that `messages/{nb,uk,es,de}.json` have the same keys as `messages/en.json`. I'll write a focused, fast, dependency-free script for that.Let me verify the file actually landed on the user's filesystem (not Claude's sandbox) and then test-run it.Right — `create_file` wrote it to my sandbox, not the user's machine. Let me read it back and write it properly with the Filesystem write tool.The file exists in my sandbox only — not yet on your machine. Let me write it there properly using the Filesystem write tool.Now let's verify it on your real filesystem and confirm it actually catches the current state of your locale files.I don't have a way to execute commands on your machine directly, but I can verify the script's logic works by running it against copies of your actual locale files in my sandbox.Let me run the actual script in my sandbox against copies of your real files to confirm it works correctly end-to-end.Now let me also get the nb.json content (I already have it above) into the same dir, plus the script itself, and run it.That was just a tool-output footer artifact, easy fix.Now let's add `nb.json` content (already have it inline from earlier) and copy the script in, then run it for real.The script works correctly — and it already found real issues in your actual `es.json` and `uk.json` (missing `guide_questions_footer` and `guide_faq_link`). But I noticed a flaw in my "same as English" heuristic: many short keys are _supposed_ to be identical across languages (brand names, proper nouns like "Plus", "A1", "B2", "Norskprøven"), so flagging those as failures is noisy. Let me fix that — downgrade it to a non-blocking note instead of a hard failure.Now let's re-sync the sandbox copy and re-run the test to confirm the fix behaves as intended (only missing/extra keys cause hard failure, exit 1).de.json is still showing FAIL despite only having "same as English" matches — my fix isn't being picked up. Let me check the actual file content.The fix did land on your real file — it's confirmed correct on disk. The sandbox's `/Users/...` path is a separate, stale cached view inside my container (not live-synced with the Filesystem tool writes), which is why my `cp`/`grep` there showed the old version. Let me re-copy properly via the Filesystem read tool this time.Now it works exactly as intended: `de.json` correctly downgraded to a `NOTE` (only identical-to-English strings, no structural gaps), while `es.json`/`uk.json` correctly fail on real missing keys, and my truncated test `nb.json` (a stub, not your real file) correctly fails too. The `nb.json` result here is just sandbox-test noise — not a finding about your real file.

The script is confirmed in place at `/Users/shinichiokada/Svelte/svelte-languages/norskeord/scripts/check-message-keys.mjs`. Run it for real with:

```
node scripts/check-message-keys.mjs
```

from your project root. Two genuine things it just surfaced on your actual `messages/`:

- **`es.json`** and **`uk.json`** are both missing `guide_questions_footer` and `guide_faq_link`.
- Add `--fix` to auto-insert `[UNTRANSLATED] <english value>` placeholders for any missing keys, so the app doesn't break while you translate them properly — then search for `[UNTRANSLATED]` in each file.

One caveat on the heuristic check: it flags any value that's byte-identical to English, which is expected for things like "Plus", "A1", "B2" (brand names/codes are supposed to stay the same), so those show as a non-blocking `NOTE` rather than a hard failure — only real missing/extra keys fail the script (exit code 1, good for CI).

---

ME: I have the following outputs. Can you check it?

```
Source of truth: messages/en.json  (969 keys)
Checking locales: de, es, nb, uk

⚠️  NOTE  messages/de.json
         Same as English / empty (63) — review, but often expected for brand names/codes: nav_plus_badge, nav_norskproven, nav_plus, nav_guide, nav_switch_to_norwegian, nav_switch_to_english, nav_quiz, nav_a1, nav_a2, nav_b1, nav_b2, quiz_title, quiz_label_level, quiz_label_category_optional, quiz_type_mc, …

❌  FAIL  messages/es.json
         Missing (2): guide_questions_footer, guide_faq_link
         Same as English / empty (50) — review, but often expected for brand names/codes: nav_plus_badge, nav_norskproven, nav_plus, nav_switch_to_norwegian, nav_switch_to_english, nav_quiz, nav_a1, nav_a2, nav_b1, nav_b2, quiz_title, grammar_plus_topic, flashcard_norsk, flashcard_english, profile_sub_plan_plus, …

❌  FAIL  messages/nb.json
         Missing (2): guide_questions_footer, guide_faq_link
         Extra (16, not in en.json): plus_badge, plus_notify_prompt, plus_signup_cta, plus_notify_success_heading, plus_notify_success_body, plus_error_empty, plus_error_invalid, plus_error_generic, plus_error_network, plus_notify_button, plus_saving, plus_no_spam, home_early_access_prefix, home_early_access_body, home_early_access_suffix, …
         Same as English / empty (53) — review, but often expected for brand names/codes: nav_plus_badge, nav_norskproven, nav_plus, nav_guide, nav_switch_to_norwegian, nav_switch_to_english, nav_quiz, nav_a1, nav_a2, nav_b1, nav_b2, quiz_title, quiz_start, grammar_plus_topic, flashcard_norsk, …

❌  FAIL  messages/uk.json
         Missing (2): guide_questions_footer, guide_faq_link
         Same as English / empty (49) — review, but often expected for brand names/codes: nav_plus_badge, nav_norskproven, nav_plus, nav_switch_to_norwegian, nav_switch_to_english, nav_a1, nav_a2, nav_b1, nav_b2, quiz_type_mc, quiz_type_fill, quiz_type_type, grammar_plus_topic, flashcard_norsk, flashcard_english, …


3 locale file(s) out of sync ❌
Run with --fix to auto-insert English placeholders for missing keys.
```

CLAUDE: This confirms what I found earlier — good, the script is working correctly on your real files. Here's the breakdown:

**`de.json` — clean.** Only the heuristic note (63 identical-to-English strings), which is expected for things like "A1", "B2", "Norskprøven", "Plus". No action needed.

**`es.json` and `uk.json` — both missing 2 keys.** `guide_questions_footer` and `guide_faq_link` exist in `en.json` but were never added to Spanish or Ukrainian. These are real gaps (I saw them in the FAQ guide section — "Have questions?" / "See the FAQ →"). Same root cause as the i18n drift we fixed earlier this session: a key gets added in English and doesn't make it into every locale.

**`nb.json` — missing 2 keys + 16 stale extra keys.** Same 2 missing keys as above, but also has 16 leftover keys not in `en.json` at all: `plus_badge`, `plus_notify_prompt`, `plus_signup_cta`, `plus_notify_success_heading`, `plus_notify_success_body`, `plus_error_empty`, `plus_error_invalid`, `plus_error_generic`, `plus_error_network`, `plus_notify_button`, `plus_saving`, `plus_no_spam`, `home_early_access_prefix`, `home_early_access_body`, `home_early_access_suffix`, `home_early_access_link`. These look like leftovers from an old pre-launch "waitlist" version of the Plus page (before Plus had real checkout) — `en.json` has since moved on to real `plus_heading`/`plus_checkout_cta`/etc. keys, but `nb.json` never had these old ones cleaned up.

Want me to fix these now? I'd:

1. Add Norwegian translations for `guide_questions_footer` / `guide_faq_link` to `nb.json` (and English-sourced placeholders or real translations to `es.json`/`uk.json` if you want me to translate them too — I can do simple UI strings, though for accuracy you may want a native speaker to review).
2. Remove the 16 stale `plus_*`/`home_early_access_*` keys from `nb.json`, since nothing in the codebase references them anymore — let me verify that with a quick grep before deleting, in case the old waitlist UI is still live somewhere.

---

ME: Before that I need a script to check if en.json has redundant/unused keys in this project. What do you think? Is it a good idea?

CLAUDE: Good idea — and there's actually already a script in your repo that might do exactly this: `scripts/remove-unused-keys.mjs`. Let me check it before building a new one, since duplicating effort isn't great.That script is a one-off hardcoded cleanup, not a general scanner — so a new script is worth building. Before I write it, let me check whether any keys are referenced dynamically (e.g. `m[\`category\_${id}\`]()`), since that would make a naive static-usage scanner produce false positives.This confirms it — I found a dynamic key pattern already:

```js
const key = `category_${level}_${slug.replace(/-/g, '_')}` as keyof typeof m;
const fn = m[key];
```

This is exactly why a naive "search for `m.key_name()` calls" scanner would be wrong — it would flag every single `category_a1_*`, `category_a2_*`, `category_b1_*`, etc. key as unused, when they're all actually used via this dynamic lookup. Let me check a couple more likely spots (norskprøven notes, dynamic norskproven topics) before designing the script.Yes, it's a good idea — and definitely worth doing, since stale keys are clearly already a problem in this codebase (we just found 16 of them in `nb.json`, and it's reasonable to assume `en.json` itself could have similar bloat). But there's a real wrinkle I want to flag before writing it.

**The catch: not all keys are referenced statically.** I checked a couple of pages and found two different patterns beyond the simple `m.key_name()` call:

1. **Fully dynamic construction** in `learn/[level]/+page.svelte`:

   ```js
   const key = `category_${level}_${slug.replace(/-/g, '_')}` as keyof typeof m;
   const fn = m[key];
   ```

   This means all ~90+ `category_a1_*`, `category_a2_*`, `category_b1_*`, etc. keys are used, but never appear as a literal `m.category_a1_greetings()` anywhere in the source — a naive regex scanner would flag every one of them as "unused," which would be wrong and dangerous if anyone trusted it blindly.

2. **Object-literal lookup tables** in `norskproven/+page.svelte`, e.g.:
   ```js
   const noteMap = { a2_shopping: m.norskproven_note_a2_shopping, ... };
   return noteMap[key]();
   ```
   This one's actually fine for a regex scanner — `m.norskproven_note_a2_shopping` still appears literally in the source, just not immediately called with `()`. So the scanner needs to match `m.key_name` as a bare property reference, not just `m.key_name(`.

So a good script needs two passes:

- **Static scan**: regex-match every `m.KEY_NAME` occurrence (with or without trailing `(`) across `.svelte`/`.ts` files in `src/`.
- **Dynamic-prefix detection**: scan for template-literal patterns like ``m[`prefix_${...}`]`` or `` `prefix_${...}` as keyof typeof m ``, extract the static prefix part (e.g. `category_`), and treat _any_ `en.json` key starting with that prefix as "used dynamically" — excluded from the unused list, but called out separately so you can eyeball that the prefix-matching is correct.

Output would then be three buckets: definitely unused (safe to remove), dynamically-referenced (skip, but listed for sanity-check), and — if I find time — a flag for keys whose dynamic prefix doesn't actually match anything in the data (e.g. a stale `category_a1_oldslug` that no real category slug maps to anymore, which static analysis alone can't catch but cross-referencing against `CATEGORIES_BY_LEVEL` in `config.ts` could).

Want me to build it with that three-bucket design? I'd also want to peek at `config.ts` and the grammar/quiz pages quickly first, since there may be a couple more dynamic-prefix patterns I haven't spotted yet (e.g. `quiz_type_*`, `stats_tooltip_*`, `part_*` for word classes).

---

ME: Go ahead to peek other files. And build it with your three-bucket design.

CLAUDE: This confirms the cross-reference data source. Now let's check `Flashcard.svelte` for `part_*` and `flashcard_*` dynamic lookups, and the grammar/quiz files.Good — I've now confirmed the only dynamic-prefix pattern in this codebase is the `category_${level}_${slug}` one in `learn/[level]/+page.svelte` (grammar titles come from a separate `GRAMMAR_RULES` data file, not `messages`, and `norskproven_note_*`/`part_*` are referenced statically via object literals or ternary chains, so they're caught fine by a plain static scan). I also noticed something important: the dynamic key replaces hyphens with underscores (`slug.replace(/-/g, '_')`), while some `en.json` keys keep hyphens (e.g. `category_a1_days-months`) — paraglide sanitizes hyphens to underscores when generating the JS function names, so I need to normalize for that when matching.

Here's the script design, three buckets:Let me test it for real — I'll try running it directly against the actual project path from my sandbox (earlier I noticed my sandbox can see this path after writes land there).My sandbox's `/Users/...` path is actually a separate, isolated copy that exists only because I created files there earlier with `create_file` — it's not actually connected to your real machine (confirmed: `node` there sees a different filesystem than the `Filesystem:write_file` tool). So I can't run the script against your full real codebase from here.

What I _can_ do is validate the script's logic by running it against a realistic subset built from the real files I've already read (which includes the actual dynamic-key pattern), to confirm the three-bucket classification works correctly before you run it for real.Now let me copy the script and the real source files I've already read into the test tree.Now let's add the real source files I've already read (which contain the dynamic pattern, static patterns, and object-literal patterns) to the test tree.Now run the test:Confirmed working as designed:

- **`category_*` keys (137 of them)** correctly landed in the "used dynamically" bucket via the discovered `category_` prefix — exactly the false positive we needed to avoid.
- **`norskproven_note_a2_shopping`, `norskproven_note_a2_transport`, `norskproven_note_b1_work`** (the object-literal lookup pattern) were correctly caught by the static scan, since they appear as bare `m.key_name` references even without `()`.
- Direct calls like `m.norskproven_badge()`, `m.level_hub_beginner()` etc. — caught normally.

The "822 possibly unused" in this test run is just a sandbox artifact — my test tree only contains 2 of your ~100 real route files, so that number is meaningless here. Don't read into it.

The real script is in place at `/Users/shinichiokada/Svelte/svelte-languages/norskeord/scripts/check-unused-keys.mjs`. Run it for real with:

```
node scripts/check-unused-keys.mjs
```

from your project root. A few things to know about the real run:

1. **It's purely a reporting tool** — it never deletes anything, just classifies and writes a full report to `scripts/outputs/unused-keys-<timestamp>.json` (console output caps the unused list at 60 entries; pass `--verbose` to print everything inline).
2. **It only scans `src/`** — if any message keys are referenced from `scripts/`, Supabase edge functions, or emails sent via a separate template system, those would false-flag as unused. Worth a quick sanity check on a few "unused" hits before deleting anything.
3. **Treat the "unused" bucket as a starting list, not a deletion list** — some keys might be intentionally reserved for an in-progress feature (like those stray `nb.json` Plus-waitlist keys we found, which might still show up as "used dynamically or statically nowhere" once you run this against `en.json` and confirm they're genuinely orphaned).

Want me to also wire up actual deletion once you've reviewed the real output — i.e. extend `remove-unused-keys.mjs`'s pattern to take a list of confirmed-unused keys and strip them from all 5 locale files at once?

---

ME: Please check the outputs in scripts/outputs/unused-keys-2026-06-30T10-16-43.json first before creating remove-unused-keys.mjs. Regarding remove-unused-keys.mjs and check-unused-keys.mjs, will it work in future when I add new language files?
CLAUDE: Let me first verify a couple of suspicious things in the report before recommending anything. Two flags caught my eye: noisy prefixes (`example_`, `word`, `ord`) and the `nav_a1`/`nav_a2`/`nav_b1`/`nav_b2` keys landing in "unused" — those feel like they could be used in a nav component I haven't checked yet.Good — `nav_a1`–`nav_b2` are genuinely unused; Nav.svelte uses the raw `{level}` string ("A1", "A2"...) directly, not `m.nav_a1()`. That's a real true positive, confirms script accuracy here. Now let's check the noisy `word`/`ord`/`example_` prefixes.I checked both flags — here's what I found.

## Report analysis

**969 keys total: 709 used statically, 137 used dynamically (all `category_*`), 123 possibly unused.**

The dynamic-key detection worked correctly for its intended purpose — all 137 `category_*` keys (A1 through C, including hyphenated ones like `category_a1_days-months`) were correctly excluded from the unused list.

**But I found a real bug in the heuristic.** The `dynamicPrefixesFound` list includes `example_`, `word`, and `ord` — these aren't message-key prefixes at all. I tracked `example_` down to `vocab-helpers.ts`:

```ts
return entry[`example_${language}` as keyof VocabEntry] as string | undefined;
```

That's indexing into a `VocabEntry` data object, completely unrelated to the `m` messages object — but my "any template literal that looks key-shaped" heuristic picked it up anyway. In this particular run it caused no harm (no `en.json` key actually starts with `example_`, `word`, or `ord`), but it's a latent risk: if you ever add a message key that happens to start with one of these generic words, it would silently get excluded from the unused report even though it's genuinely dead. I need to tighten this — the scan should only treat a template literal as a dynamic-key candidate when it's actually used to index `m` (either `m[\`...\`]`directly, or assigned to a variable that's later used as`m[varName]`), not just any key-shaped backtick string anywhere in the codebase.

**I spot-checked one of the "unused" hits** — `nav_a1`/`nav_a2`/`nav_b1`/`nav_b2` — against `Nav.svelte`, and confirmed it's a true positive: the nav renders the raw `{level}` string ("A1", "A2"...) directly rather than calling `m.nav_a1()` etc. So the unused list itself looks trustworthy; it's only the dynamic-prefix detection that needs hardening.

## Your future-language question

Good catch to ask before I build the remove script — there's a real asymmetry between the two scripts here:

- **`check-unused-keys.mjs` is already future-proof.** It only reads `messages/en.json` and scans `src/` — it never enumerates locale files, so adding `fr.json` tomorrow doesn't change its behavior at all.
- **The existing `remove-unused-keys.mjs` is NOT future-proof** — it hardcodes `const LOCALES = ['en', 'nb', 'es', 'uk', 'de'];`. If you add a 6th language file later and someone runs that old script, the new locale would silently be skipped and accumulate the same stale keys nobody noticed. I'll build the new removal script to auto-discover every `messages/*.json` file (the same pattern `check-message-keys.mjs` already uses via `readdirSync`), so it scales automatically with no maintenance needed when you add languages.

Want me to go ahead and: (1) tighten `check-unused-keys.mjs`'s dynamic-prefix detection to only fire on actual `m[...]` indexing, and (2) build the new `remove-unused-keys.mjs` with auto-discovery of locale files plus a confirmation/dry-run flow before it deletes anything?

---

ME: One more questions. unused-keys-2026-06-30T10-16-43.json file has dynamic and unused entries. Will your remove-unused-keys.mjs remove only unused?
Aren't dynamic keys are actually used in code?
Once removed the unused keys, do you think it's good idea to have a script to check all i18n in codes are in en.json file? (backward checking) Is it necessary? What do you think?
CLAUDE:Good questions — let me answer all three.

**1. Will it remove only "unused," not "dynamic"?**

Yes — that's the whole point of having three buckets instead of two. The new `remove-unused-keys.mjs` will only ever operate on the `unused` array from the report. It won't touch anything in `dynamic` or `used`.

**2. Aren't dynamic keys actually used in code?**

Correct, and that's exactly why they're a separate bucket rather than merged into "used." All 137 `category_*` keys are genuinely referenced — just indirectly, through `m[key]` where `key` is built from a template literal at runtime, not through a literal `m.category_a1_greetings()` call anywhere in the source. If `remove-unused-keys.mjs` deleted those, the app wouldn't crash (the `categoryLabel()` function has a fallback to `removeHyphensAndCapitalize(slug)`), but every category badge would silently lose its translation and just show the raw slug — a regression that's easy to miss in testing. So yes: dynamic = used, just not _statically_ used, and the removal script must never touch it.

**3. Is a backward checker (code → en.json) a good idea?**

Worth doing, but I want to be honest about where it actually adds value versus where it's redundant, because the answer differs by usage pattern:

For **static** `m.key_name()` calls, a backward checker is mostly redundant here. Paraglide generates `messages.js` directly from `en.json`, so if you write `m.some_typo_key()` and that key doesn't exist, TypeScript already fails the build — `m` is typed from the generated exports, so a missing key is a compile error, not a silent runtime issue. A script duplicating that check would mostly just be a slower version of `tsc`.

For **dynamic** key construction, though, a backward checker would catch something TypeScript genuinely can't. Look at the actual code again:

```ts
const key = `category_${level}_${slug.replace(/-/g, '_')}` as keyof typeof m;
const fn = m[key];
```

That `as keyof typeof m` is an explicit type assertion — it tells TypeScript "trust me," which bypasses compile-time checking entirely. So if someone adds a new category to `CATEGORIES_BY_LEVEL` in `config.ts` but forgets to add the matching `category_<level>_<slug>` key to `en.json`, nothing fails at build time. At runtime, `categoryLabel()` just silently falls back to `removeHyphensAndCapitalize(slug)` and shows an untranslated label — exactly the kind of bug that's easy to ship unnoticed.

So my actual recommendation: instead of a generic "every `m.foo()` call must exist in `en.json`" scanner (low value, duplicates `tsc`), build a **targeted completeness check** that cross-references `CATEGORIES_BY_LEVEL` in `config.ts` against `en.json` and confirms every expected `category_<level>_<slug>` key actually exists — catching exactly the gap that the type-assertion bypasses. That's the one genuinely necessary piece; the rest is good-to-have but lower priority.

Want me to build all three now — the tightened `check-unused-keys.mjs`, the locale-auto-discovering `remove-unused-keys.mjs`, and this targeted category-completeness checker?

---

ME: Yes please.
CLAUDE:
Let me check how existing scripts handle importing from `.ts` files (like `config.ts`), since that determines how I parse `CATEGORIES_BY_LEVEL` reliably.`tsx` is already a devDependency and used for other TS scripts (`build-search-index.ts`, `generate-lessons.ts`). Let me check how those resolve `$lib` imports, since I want `check-category-keys.ts` to import `CATEGORIES_BY_LEVEL` directly from `config.ts` rather than regex-parsing it.Let's build all three. First, the tightened `check-unused-keys.mjs` — replacing the blanket template-literal scan with one that only fires when a template is actually used to index `m`.
