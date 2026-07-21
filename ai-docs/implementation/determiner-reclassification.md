# Determiner Part-of-Speech — Reclassification (All Levels)

## Overview

Follow-up to the `data-rules/recommendation.md` → `data-rules/vocab-and-uttrykk.md` update.
`recommendation.md` listed **determiners** as their own vocab category, but the current doc's
`part` enum has no `determiner` value — Norwegian determiners (denne/dette/disse, min/din/sin,
mange/få/noen/ingen, etc.) are currently filed under `pronoun` or `adjective` by default, with no
consistent rule for which. This plan adds `determiner` as a real `part` value and reclassifies
existing entries across **all five levels** (A1–C), in both `vocab-*.json` and, where relevant,
`uttrykk-*.json`.

**Scope decision, flagged for your call before Phase 1:** Norwegian grammars don't fully agree on
what counts as a determinativ. Recommending the narrower, more defensible scope:

| Include as `determiner`                     | Examples                                                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Demonstratives                              | denne, dette, disse                                                                                                                                                      |
| Possessives                                 | min, din, hans, hennes, vår, deres, sin, sitt, sine                                                                                                                      |
| Quantifiers                                 | mange, få, noen, ingen, all/alt/alle, hver/hvert, begge, enhver                                                                                                          |
| **Exclude — keep as `pronoun`**             | jeg, du, han, hun, vi, dere, de, meg, deg... (personal pronouns — they stand _in place of_ a noun, don't modify one)                                                     |
| **Exclude — keep as `pronoun`** (confirmed) | den, det, de — always `pronoun`, whether anaphoric ("Den er i kjøleskapet") or demonstrative-standalone; not split into a separate determiner sense for this word family |
| **Exclude — no change needed**              | en/ei/et as the indefinite article baked into a noun's `norsk` field (`hus (et)`) — not a standalone lexical entry, so out of scope here                                 |

The den/det/de and min/din-family overlap is the trickiest part: the _same word_ is a determiner
when it modifies a noun ("min bok") and a pronoun when it stands alone ("Den er min"). Recommend
classifying by the **example sentence's actual usage** on each existing entry, not by word list
alone — see Phase 2's audit approach.

---

## Part 1 — Rules doc (`data-rules/vocab-and-uttrykk.md`)

Add `determiner` to:

- The `part` values list (currently: `noun · verb · adjective · adverb · conjunction ·
preposition · pronoun · numeral · interjection · phrase`).
- The `norsk`/`lemma` field-format tables — determiners behave like `pronoun`/`adverb` (uninflected
  base form, no gender marker needed since they inflect _with_ the noun they modify, not
  independently — e.g. `min` is the shared citation form even though `mi`/`mitt`/`mine` are the
  inflected forms actually used in sentences, same pattern as `adjective`'s masculine-singular
  citation form).
- The vocab-vs-uttrykk category lists: add "determiners" to the `vocab` bullet list (nouns, verbs,
  adjectives, ... **determiners**, numerals, interjections).
- A short new subsection distinguishing determiner-use from pronoun-use for den/det/de and the
  min/din family, with the two contrastive examples above, so future contributors don't have to
  rediscover the ambiguity.

---

## Part 2 — Types (`src/lib/types.ts`)

```typescript
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'determiner' // new
  | 'numeral'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'phrase';
```

Placed after `pronoun` since determiners are closest to it conceptually (the recurring
ambiguity noted above) — ordering is cosmetic but keeping related values adjacent helps anyone
scanning the enum.

---

## Part 3 — Admin UI

### `src/routes/admin/vocab/+page.svelte`

Add `'determiner'` to the `PARTS` array. **Also add the missing `'numeral'`** while touching this
array — unrelated to determiners, but it's the same pre-existing gap in the same array, so fixing
both in one pass avoids a second near-identical PR:

```typescript
const PARTS: PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'determiner', // new
  'numeral', // pre-existing gap, unrelated to this plan — fixed alongside
  'preposition',
  'conjunction',
  'interjection',
  'phrase'
];
```

### `src/routes/admin/uttrykk/+page.svelte`

No change expected — its `PARTS` list (`phrase, noun, verb, adjective, adverb, interjection`)
already excludes `pronoun`/`numeral`/`preposition`, and determiners are vocab items by definition
(Part 1's scope), not uttrykk. Confirm no existing uttrykk entry has `part: 'pronoun'` on a
determiner-like lemma before assuming this — flagged for the Phase 4 audit, not assumed here.

---

## Part 4 — Data reclassification (audit, all levels)

**Confirmed via `scripts/find_dupes.py` (per your check):** no word currently has separate cards for
its determiner-use and pronoun-use — each lemma is a single entry. That removes the split-card
risk flagged in the first draft of this plan; Phase 4 doesn't need to handle that case.

**Revised expectation after sampling two demonstrative entries (`dette` v-a2-communication-029,
`denne` v-a1-pronouns-and-questions-022):** both use the word standing alone as the subject
("Dette er min beste venn", "Hva er dette?"), not modifying a following noun — i.e. both are
already correctly `pronoun`, not miscategorized. If this pattern holds across the rest of the
denne/dette/disse entries, **the audit may find zero demonstratives to reclassify** — the
noun-modifying (determiner) use isn't represented as a vocab card at all right now, and doesn't
need to be: it's already taught by `grammar.json`'s `denne-dette-disse` topic. That's a coverage
gap that's already closed elsewhere, not a `part` mislabeling. Don't treat "no determiner entries
found" as a failed audit — it may simply mean this category needed no data changes, only the
rules-doc clarification from Part 1.

**Unrelated bug spotted while sampling, flagging separately:** `v-a1-pronouns-and-questions-022`
has `lemma: "denne"` but its `example` field reads "Hva er dette?" — uses `dette`, not `denne`.
Worth a data fix, but out of scope for this plan (not a `part`/determiner issue).

**Approach:** don't bulk-relabel by word list — check each candidate entry's actual `example`
usage, per the demonstrative finding above. Process:

1. For each of `vocab-a1.json` … `vocab-c.json`, find entries whose `lemma` matches the include
   list above (denne/dette/disse, min/din/hans/hennes/vår/deres/sin/sitt/sine, mange/få/noen/
   ingen/all/alt/alle/hver/hvert/begge/enhver) and current `part` is `pronoun` or `adjective`.
2. For each match, check whether `example` uses the word to **modify a following noun**
   (determiner — reclassify) or **stand alone** (pronoun/predicative — leave as is, per the
   demonstrative sample above). Expect possessives (min/din/sin family) to split both ways —
   "boka mi" (determiner) vs. "Den er min" (predicative/pronoun-like) — so don't assume the
   demonstrative pattern (mostly standalone) carries over to possessives without checking.
3. Quantifiers (mange/få/noen/ingen/all/hver/begge) are more likely to show genuine determiner use
   in their existing examples ("mange bøker", "noen venner") since they're less naturally
   standalone — expect a higher reclassification rate here than for demonstratives.
4. Reclassify confirmed determiner-use matches to `part: 'determiner'`, leaving every other field
   untouched.
5. Repeat for `uttrykk-*.json` only if any determiner-like lemma turns up there — expected to be
   rare/none per Part 3's reasoning, but worth the same pass rather than assuming.
6. Cross-reference against `grammar.json`'s A1 topics `denne-dette-disse`, `possessiver-min-din`,
   and `refleksivt-possessiv-sin` (from `a1-quiz-and-grammar.md`) — those grammar topics already
   teach these words' rules; this reclassification doesn't change the grammar content, only the
   vocab-entry metadata, so no `grammar.json` changes are needed here.

**Not run yet** — per your "no need to check data file now," this plan stops at defining the
audit approach; Phase 4 below is where it actually executes.

---

## Implementation phases

### Phase 1 — Rules + types

1. Update `data-rules/vocab-and-uttrykk.md` (Part 1).
2. Add `determiner` to `PartOfSpeech` in `types.ts` (Part 2).

### Phase 2 — Admin UI

1. Add `determiner` (+ fix missing `numeral`) to `admin/vocab/+page.svelte`'s `PARTS` array.
2. Confirm `admin/uttrykk/+page.svelte` needs no change (spot-check, don't assume).

### Phase 3 — Build/type check

1. `pnpm check` — confirm no other code path has an exhaustive `switch`/union check over
   `PartOfSpeech` that needs a new case (none found in `quiz.ts`, which doesn't branch on `part` at
   all — but worth a repo-wide search before calling this done, since this plan didn't check every
   file).

### Phase 4 — Data audit + reclassification (all levels)

1. Run the Part 4 audit against `vocab-a1.json` → `vocab-c.json`, in that order.
2. Run the same audit against `uttrykk-a1.json` → `uttrykk-c.json`.
3. Spot-check `/quiz` and the admin filter dropdown (`filterPart`) after publishing, to confirm
   reclassified entries surface correctly under the new `determiner` filter.

### Phase 5 — Testing

1. Extend any existing "every vocab entry has a valid `part`" check (if one exists — confirm) to
   include `determiner` automatically, since it's a union member now.

---

## Open questions

- **Scope confirmation:** does the demonstrative/possessive/quantifier-only scope above match your
  intent, or should indefinite articles (en/ei/et) also get pulled out of the noun's `norsk` field
  into their own determiner entries? That would be a much bigger schema change (every noun entry's
  format changes) — recommend keeping this plan scoped to Part 1's narrower definition unless you
  want that larger change as a separate plan.
- ~~den/det/de duplicate risk~~ — resolved: you confirmed `den/det/de` stay `pronoun` (not split
  into a determiner sense), and `scripts/find_dupes.py` confirms no lemma currently has separate
  determiner-use/pronoun-use cards. Phase 4 no longer needs to handle a split-card case.
- **New, from sampling:** if the demonstrative pattern holds (existing denne/dette/disse entries
  are all standalone/pronominal, not noun-modifying), should this plan _add_ new determiner-use
  vocab cards for denne/dette/disse (e.g. "denne bilen er fin"), or leave that use covered only by
  the `grammar.json` `denne-dette-disse` topic as it is today? Leaning toward leaving it as-is —
  adding standalone vocab cards for a pattern the grammar topic already drills would be redundant
  content, not a gap-fill — but flagging since it's a new consideration, not decided yet.
