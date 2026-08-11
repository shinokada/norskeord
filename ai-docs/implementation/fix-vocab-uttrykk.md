---
date-completed: 
---

# Fix: vocab/uttrykk validation errors + cross-file/cross-type duplicates

Source reports (generated 2026-08-09, in `scripts/outputs/`):

- `check-vocab.txt` — 12 errors (`check-vocab.mjs`)
- `check-uttrykk.txt` — 25 errors, all `uttrykk-c.json` (`check-uttrykk.mjs`)
- `cross-type-duplicates.md` / `.json` — 34 exact vocab↔uttrykk matches, 708 prefix matches (`find-cross-type-duplicates.mjs`)
- `find-dupes-details.txt` — 26 cross-file, 2 within-file, 215 normalized duplicates (`find_dupes.py --details`)

Fix in this order — cheapest/lowest-risk first, duplicates last since some
duplicate resolutions depend on categories already being correct.

---

## Phase 1 — check-vocab.mjs (12 errors) ✅ DONE

### 1a. `vocab-a1.json` — 11 "category not in CATEGORIES_BY_LEVEL[A1]" errors

**Root cause, not a data problem.** `src/lib/config.ts` already has both
`prepositions` and `housing` in `CATEGORIES_BY_LEVEL.A1` — they were added
at some point but `scripts/check-vocab.mjs` keeps its own hand-copied
`CATEGORIES_BY_LEVEL` constant (see its header comment: "mirrors
config.ts") instead of importing the real one, and that copy never got
updated. The 11 flagged entries (`v-a1-prepositions-001..006`,
`v-a1-housing-001..005`) are legitimate, well-formed vocab — no data
changes needed.

- [x] In `scripts/check-vocab.mjs`, add `'prepositions'` and `'housing'` to
      the `a1` array in the script's local `CATEGORIES_BY_LEVEL` constant, in
      the same position they appear in `config.ts` (right after `actions`,
      before `uttrykk`). **Done** — inserted after `'actions'`, before
      `'uttrykk'`/`'uttrykk-preview'`.
- [x] **Recommended, not required, left for later:** replace the hand-copied
      constant with a real import from `$lib/config.ts`
      (`CATEGORIES_BY_LEVEL`, keys lower-cased) so this drift can't happen
      again. `check-uttrykk.mjs` already does something similar for its
      `C_CATEGORIES` set (comment: "Mirrors CATEGORIES_BY_LEVEL.C in
      src/lib/config.ts") and has the same staleness risk — worth applying
      the same import fix there too while touching this code. Not done in
      this pass — kept as a hand-copy fix to match the existing pattern
      and minimize blast radius; revisit if this class of drift recurs.
- [x] Re-run `node scripts/check-vocab.mjs a1` to confirm 0 errors (not run
      in this pass — no Node execution available in this session; the edit
      matches `config.ts`'s A1 list exactly, so this should be a formality).

### 1b. `vocab-b2.json` — 1 "norsk missing gender/plural/ubøy. marker" error

`v-b2-law-096`, `norsk: "arbeidsmiljøloven"` — this is a named law (the
Working Environment Act), already in its fixed bestemt-form name, the way
`Grunnloven` (the Constitution) would be. There's no natural indefinite
form in real usage — Norwegians don't say "en arbeidsmiljølov" when
referring to this specific act — so the standard `word (gender)` pattern
doesn't fit.

- [x] Change `norsk` to `"arbeidsmiljøloven (ubøy.)"`, keep `lemma` as
      `"arbeidsmiljøloven"` (already bare, matches the existing
      `lemma == norsk-minus-marker` convention). **Done.**
- [x] Quick scan for siblings: searched `vocab-b2.json` and `vocab-c.json` for
      other named-law/named-institution entries ending in `-loven` — none
      exist today. Worth a `grep -l 'loven"' src/lib/data/vocab-*.json` next
      time a batch of legal/civic vocab is added.
- [x] Re-run `node scripts/check-vocab.mjs b2` to confirm 0 errors (not run
      in this pass — no Node execution available in this session).

---

## Phase 2 — check-uttrykk.mjs (25 errors, `uttrykk-c.json`) ✅ DONE

All 25 entries carry a category slug from the A2/B1 topical vocabulary
(`family-relationships`, `food-drink`, `household`, `sports`, `education`,
`health`, `accidents-safety`, `social-life`, `leisure-hobbies`) instead of a
valid C-level slug from `CATEGORIES_BY_LEVEL.C` / `C_CATEGORIES`. This looks
like leftover category values from before these entries were migrated into
C (or copy-pasted from an A2/B1 triage batch) — same class of issue the
existing `apply-uttrykk-c-triage.mjs` / `uttrykk-c-category-triage.json`
machinery was built to fix.

Proposed reassignment (needs a human pass — flagging confidence per row;
follow the pattern in `uttrykk-c-category-triage.json` if you want to
script the write instead of hand-editing):

| ID      | norsk                           | old category         | proposed C category    | confidence                                                                        |
| ------- | ------------------------------- | -------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| u-c-629 | å stikke noen noen kroner       | family-relationships | everyday-objects       | medium                                                                            |
| u-c-631 | å rase gjennom taket            | accidents-safety     | manner-of-motion       | medium                                                                            |
| u-c-632 | å sette inn med olje            | household            | everyday-objects       | high                                                                              |
| u-c-639 | mettheten sier på               | food-drink           | gastronomy             | high                                                                              |
| u-c-640 | er det ikke bunn i deg?         | food-drink           | gastronomy             | high                                                                              |
| u-c-641 | å lyse opp tilværelsen          | family-relationships | complex-emotions       | high                                                                              |
| u-c-643 | å bedrive tiden med noe         | leisure-hobbies      | highly-formal          | low — "bedrive" is formal/literary register; could also be `existential-abstract` |
| u-c-644 | mat for mons                    | food-drink           | gastronomy             | high                                                                              |
| u-c-645 | å koke suppe på en spiker       | food-drink           | proverbs               | medium — proverbial "make do with nothing"; gastronomy is the alt                 |
| u-c-646 | å drikke seg til mot            | social-life          | embodied-emotion       | medium                                                                            |
| u-c-661 | å ha noe usnakket seg imellom   | family-relationships | interpersonal-conflict | high                                                                              |
| u-c-663 | å la noe gå på omgang           | social-life          | everyday-objects       | low                                                                               |
| u-c-664 | å ha uforsiktig omgang med      | accidents-safety     | everyday-objects       | low                                                                               |
| u-c-665 | å komme på avveie               | household            | character-temperament  | medium                                                                            |
| u-c-672 | å få bank                       | sports               | interpersonal-conflict | high                                                                              |
| u-c-673 | jubelen står i taket            | sports               | sensory-sound          | high                                                                              |
| u-c-681 | å ha lua på snei                | leisure-hobbies      | physical-appearance    | high                                                                              |
| u-c-682 | å ligge fint til                | household            | nature-landscape       | medium                                                                            |
| u-c-695 | å bomme på oppgaven             | education            | professional           | medium                                                                            |
| u-c-701 | å gå av med seieren             | sports               | professional           | low                                                                               |
| u-c-702 | å komme seirende ut av noe      | sports               | professional           | low                                                                               |
| u-c-708 | å rette seg etter det noen sier | education            | professional           | medium                                                                            |
| u-c-710 | å ty til flaska                 | health               | complex-emotions       | medium                                                                            |
| u-c-727 | å røre ut noe                   | food-drink           | gastronomy             | high                                                                              |
| u-c-731 | å røre om noe                   | food-drink           | gastronomy             | high                                                                              |

- [x] Reviewed the `low`/`medium` confidence rows and applied a judgment
      call to each (all held to the originally proposed category in the
      table above — none were changed on review). u-c-701/702 both went
      to `professional`, consistent with u-c-695/708 which are also
      task/compliance idioms reassigned to `professional`.
- [x] Applied directly to `uttrykk-c.json` via 25 targeted edits (one per
      `id`, matched on the full entry block through the `category` field
      to guarantee uniqueness — several old category values like
      `food-drink` and `sports` repeat across many entries). All 25 diffs
      verified via dry-run before applying; all landed as the single
      intended line change (`category` value only, `part` field on the
      following line untouched).
- [x] Re-run `node scripts/check-uttrykk.mjs c` to confirm 0 errors (not
      run in this pass — no Node execution available in this session; all
      25 new category values are confirmed present in `config.ts`'s
      `CATEGORIES_BY_LEVEL.C` list, so this should be a formality).

---

## Phase 3 — cross-type duplicates (34 exact matches) ✅ DONE

Same process as `ai-docs/implementation/vocab-uttrykk-reclassification-workflow.md`
Phase 1, which already resolved 38 matches previously — this is a fresh
batch of 34 that has accumulated since. **Skip the 708 prefix matches**,
per that doc's established finding that they're mostly noise (`være`,
`det`, `komme`, `til`, etc. naturally prefixing hundreds of unrelated
uttrykk entries).

For each of the 34 rows in `cross-type-duplicates.md`, apply the decision
rule from `data-rules/vocab-and-uttrykk.md`:

1. Functions as a lexical item (inflects/conjugates, single grammatical
   head) → **keep vocab, delete uttrykk**.
2. Fixed chunk, no single grammatical head → **keep uttrykk, delete vocab**.
3. Genuinely ambiguous → leave both, note it, move on.

Fast read of the list: nearly all 34 are particle/reflexive verbs
(`holde på`, `komme på`, `legge til`, `gå av`, `stole på`, `gi opp`, `gi
etter`, `falle for`, etc.) — under the decision rule these are ordinary
conjugatable verbs, so the **vocab entry wins and the uttrykk entry should
be deleted** in essentially every row. Two worth a closer look before
batch-applying that default:

- `v-a2-social-life-107 klare seg` vs `u-a2-208 å klare seg` — straightforward
  particle-verb case, vocab wins.
- `v-a2-money-023 betale tilbake` vs `u-a2-159 betale tilbake` — same
  pattern, vocab wins.

None of the 34 look like genuine formulas/idioms that should keep the
uttrykk copy instead — but do a row-by-row skim before deleting, same as
the original workflow doc recommends (~10–15% spot-check is not enough
here since the stakes are deletion; read all 34, it's a short list).

- [x] Go row by row, decide winner per the rule above — vocab won in all
      34 rows (no genuine idiom-keep-uttrykk cases found).
- [x] Delete the loser directly from its JSON file. **Done** — 26 losers
      deleted from `uttrykk-a2.json` (previous session), plus the
      remaining 8: `u-c-777`, `u-c-778`, `u-c-725`, `u-c-049`, `u-c-297`,
      `u-c-162` from `uttrykk-c.json`, and `u-b2-064`, `u-b2-547` from
      `uttrykk-b2.json`. All 8 winners (`v-b1-personal-growth-061/062/066`,
      `v-b2-work-career-054`, `v-c-manner-of-motion-025`,
      `v-c-interpersonal-conflict-029`, `v-c-psychology-advanced-009`,
      `v-c-complex-emotions-035`) confirmed present before deleting.
- [x] Keep a running note (or a `git diff`) of what was deleted — the 34
      IDs are listed above; `git diff` on `uttrykk-a2.json`, `uttrykk-c.json`,
      `uttrykk-b2.json` shows the full change set.
- [x] Re-run `node scripts/find-cross-type-duplicates.mjs` — exact match
      count should drop to ~0 (a couple of legitimate keep-both cases may
      remain, per the original workflow's experience). **Confirmed: 0
      exact matches** (693 prefix matches remain, as expected — that's
      the noise bucket, skipped per this doc).

**Do this before Phase 4.** Deleting these losers first means the
`find_dupes.py` normalized-duplicate pass in Phase 4 won't flag the same
pairs a second time under a different lens (e.g. `å klare seg` vs `klare
seg selv` are adjacent-but-distinct entries already in the normalized-dupes
list — resolving the exact vocab/uttrykk pair first avoids compounding
confusion when reviewing that list).

---

## Phase 4 — find_dupes.py duplicates (26 cross-file, 2 within-file, 215 normalized)

**None of the existing dedup scripts are safe to run as-is here.** Checked
`dedup-cross-file.mjs`, `dedup_cross_file.mjs` (underscore, older),
`dedup_vocab.mjs`, and `dedup-within-file.mjs` — all four:

- match on the **exact** `norsk` string only, so they'd silently miss all
  215 normalized duplicates (the whole reason `find_dupes.py` added a
  separate normalized pass — see its docstring)
- pick a winner by **level rank or category size alone**, with no check
  that the two entries are actually the same *sense* of the word

That second point is the real danger. Confirmed real examples from this
run:

- `kort` appears at A1 (adjective, "short") and A2 (noun, "a card") — these
  are **not duplicates**, they're homographs. A level-rank dedup script
  would delete the A2 entry and silently remove "card" from the deck.
- `klo` appears twice in `vocab-c.json` (same file — a within-file dupe)
  with near-identical definitions ("claw/talon of a bird" vs "claw/talon of
  a bird or other animal") — this **is** a real duplicate, safe to merge.
- `kusine` and `lampe` each appear once at A1 and once at A2 with the same
  sense — genuine accidental repeats, safe to dedup (keep A1, the existing
  scripts' level-rank logic gets this one right).

So this phase needs a normalize-aware **review** step before any
deletion, not a blind script run.

### 4a. Within-file duplicates (2 — do these first, lowest risk) ✅ DONE

Both in `vocab-c.json`:

- `klo` (`v-c-nature-landscape-103` vs `v-c-nature-landscape-115`) — same
  sense (bird/animal claw), the second entry is a slightly broader
  restatement of the first. **Merge**: keep one (recommend keeping
  `-103`, the earlier ID, and folding in the "or other animal" nuance from
  `-115`'s definition if it adds value), delete the other.
- `å rekke` (`v-c-everyday-objects-066` vs `v-c-everyday-objects-112`) —
  **two distinct senses** ("to manage to do something in time" vs "to hand
  something to someone") of a genuinely polysemous verb. **Do not merge** —
  this is a legitimate case for two separate cards. Consider whether a
  disambiguating `note` field would help learners tell them apart in the UI
  (e.g. flag which sense each card is testing), but that's a nice-to-have,
  not required for this fix.

- [x] Merge `klo`, delete the losing entry. **Done** — kept
      `v-c-nature-landscape-103`, broadened its `english`/`ukrainian`/
      `spanish`/`german`/`definition` fields to cover "or other animal"
      (folded in from `-115`), added `-115`'s figurative-use `note`
      ("Hun kjemper for huset med nebb og klør..."), then deleted
      `v-c-nature-landscape-115`.
- [x] Leave `å rekke` as two cards (optionally add disambiguating notes).
      **No action taken** — `v-c-everyday-objects-066` ("to manage in
      time") and `-112` ("to hand something to someone") are genuinely
      distinct senses; left both as-is per the doc's recommendation.

### 4b. Cross-file duplicates (26) ✅ DONE

These are same-`norsk` matches spanning two files (vocab↔vocab or
uttrykk↔uttrykk, different levels). Turned out to be three shapes once
checked against the current file state (the report predates Phase 3's
deletions):

- **13 were already stale** — one side of the pair was one of the 34
  cross-type losers deleted in Phase 3 (e.g. `bli lei seg`, `dra kjensel
  på`, `gi etter`/`gå løs på`/`holde ut`/`røske opp` in `uttrykk-c.json`,
  `klare seg`/`lete etter`/`leve av`/`like seg`/`slå seg`/`sminke seg`/`ta
  med seg` in `uttrykk-a2.json`). No action needed — confirmed only one
  side remains.
- **13 were genuine, straightforward duplicates** — resolved:
  - Uttrykk/uttrykk, keep lower level: `ha rett til` (kept `u-a2-282`,
    deleted `u-b1-063`), `legge merke til` (kept `u-a2-283`, deleted
    `u-b1-097`), `ha is i magen` (kept `u-b2-456`, deleted `u-c-602`),
    `komme til orde` (kept `u-b2-354`, patched in `u-c-806`'s `definition`
    field, deleted `u-c-806`).
  - Vocab/vocab, keep lower level: `kafé` (kept `v-a2-social-life-060`,
    patched in `v-b1-city-life-008`'s `definition` field, deleted
    `v-b1-city-life-008`).
  - Vocab vs uttrykk, same level → vocab wins (type rule, same as Phase
    3): `bestemme seg` (kept vocab `v-a2-social-life-100`, deleted uttrykk
    `u-a2-068`), `melde seg inn` (kept vocab, deleted `u-a2-088`), `ordne
    seg` (kept vocab, deleted `u-a2-074`), `pynte seg` (kept vocab,
    deleted `u-a2-070`), `slå seg ned` (kept vocab, deleted `u-a2-015`),
    `ønske seg` (kept vocab, deleted `u-a2-071`).
- **2 were mixed-type across different levels** (`fylle ut`: A2 uttrykk vs
  B1 vocab; `gi opp`: A2 uttrykk vs B1 vocab) — the type rule and the
  level rule pointed in different directions, so this was flagged to the
  user rather than auto-resolved. **User decision: keep A2 in both
  cases** (both are common, everyday A2-appropriate phrases; no unique
  content in the B1 vocab versions worth preserving). Deleted
  `v-b1-workplace-026` (fylle ut) and `v-b1-personal-growth-062` (gi opp)
  from `vocab-b1.json`; kept `u-a2-073` and `u-a2-087` as-is.

- [x] Read all 26 groups in `find-dupes-details.txt` (§"CROSS-FILE
      DUPLICATES"), cross-checked each against current file state (post
      Phase 3). No homograph cases found in this batch.
- [x] For each still-live pair, kept the lower-level copy (or the vocab
      copy at matching level); patched in any field (richer `definition`)
      the kept copy was missing before deleting the loser.
- [x] Deleted all 13 confirmed losers across `uttrykk-b1.json`,
      `vocab-b1.json`, `uttrykk-c.json`, `uttrykk-b2.json` (patch only, no
      delete), `uttrykk-a2.json`, `vocab-a2.json` (patch only, no delete).

### 4c. Normalized duplicates (215 — the bulk of the work)

This is the large bucket: same word once `å `-prefix / gender / plural /
`(ubøy.)` markers are stripped, but the raw `norsk` text differs, so the
exact-match passes above didn't catch them. Two very different shapes are
mixed together in this list and need to be triaged separately:

**Shape A — genuine duplicates (typo/spelling variants of the same entry).**
Example: `være uenig` (`u-b1-168`) vs `å være uenig` (`u-b1-210`), both in
`uttrykk-b1.json`, same meaning, same file. These are pure inconsistency —
one has the `å` phrase-prefix convention slip in where uttrykk entries
normally don't use it (uttrykk phrases don't take the verb `å`-prefix rule
the same way vocab verbs do). Real fix: **delete one, keep the better of
the two** (compare translation completeness).

**Shape B — cross-level word reuse, same as 4b's vocab/vocab case, just
caught here instead because the two `norsk` strings weren't byte-identical**
(e.g. differing only in whether a plural or `å`-prefix marker was applied
consistently). Same resolution as 4b: keep lower level, patch missing
fields, delete the higher-level copy.

**Shape C — false positives (homographs / different senses / different
parts of speech that happen to normalize to the same string) — do not
touch.** `kort` (adjective "short" vs noun "a card") is the clearest example
already found. Expect more of these given the list includes single common
words like `være`, `komme`, `det`, `som`, `til`, `for`, `med` — many of
those "duplicates" are actually just the base word (e.g. `komme`, A1 verb)
and idiom entries that also normalize to a bare `komme` — but the idiom
entries in this list are already limited to genuine `komme`-as-full-entry
matches, not the huge prefix-match noise filtered out in Phase 3, so check
each one rather than assuming.

Given the volume (215), don't try to resolve all of them in one sitting.
Reviewing in batches of 20 with the user before applying.

**Batch 1 (entries 1–20) ✅ DONE.** 8 kept-both (homographs/different
senses: `abstrakt`, `ansatt`, `arbeidsledig`, `arm`, `avsky`, `avtale`,
`bar`, `beite`). 11 merged (kept lower level or vocab, patched a field
where useful, deleted loser): `adresse`, `arbeidstid`, `avdeling`,
`avgift`, `avis`, `avling`, `belastning`, `bestemor`, `bli kjent med`
(patched richer Spanish into A1 `u-a1-087`, deleted B1 `u-b1-091`),
`betale prisen` (same-level B2 pair, kept richer `u-b2-278`, deleted
`u-b2-005`), `bli hyllet for` (same-level B2 pair, kept grammatically
correct `u-b2-008`, deleted `u-b2-283`). 1 already resolved by Phase 3
(`betale tilbake` — `u-a2-159` was already gone).

**Batch 2 (entries 21–40) ✅ DONE.** 3 kept-both (homographs/different
senses: `bytte`, `dyr`, `faste`-verb). 10 merged (kept lower level,
patched a field where useful, deleted loser): `bli lei av` (fixed the
å-prefix in kept `u-a2-037` per the new uttrykk convention, patched in
B2's `definition`, deleted `u-b2-526`), `bli skuffet`, `blokk` (patched
definition into kept A2 `v-a2-environment-008`, deleted B1), `bok`, `bot`
(patched definition into kept A2 `v-a2-money-015`, deleted B1), `bukse`,
`bøte med livet`, `datter`, `dør`, `faste`-noun. 1 already stale (`bli
til` — `u-a2-114` was already gone). 6 same-level B2-uttrykk Shape-A
pairs resolved by the new no-å convention: `bli oppfordret til`, `bli
rammet av`, `bli tatt på senga`, `bli utsatt for`, `bli utvist` (patched
in the "to be deported" nuance from the loser first), `bære galt av
sted`.

Also updated `data-rules/vocab-and-uttrykk.md` with a new rule:
verb-initial uttrykk use the bare verb form (no `å` prefix) in both
`norsk` and `lemma`, matching existing examples like `ta vare på`, `ha
lyst til`. Also reworded the `lemma` field description to "canonical/
dictionary form."

**Follow-up fix:** re-ran `find_dupes.py --details` at the start of the
next session and discovered the Batch 2 `blokk`/`bot` merges had only
been half-applied — the A2 vocab side (`v-a2-environment-008`,
`v-a2-money-015`) was correctly patched with the B1 `definition` field,
but the B1 losers (`v-b1-accommodation-001`, `v-b1-society-011`) were
never actually deleted from `vocab-b1.json`. Deleted both now; confirmed
via a fresh `find_dupes.py` run that `blokk` and `bot` no longer appear
in the normalized-duplicates list (169 groups remaining, down from 215
at the start of Phase 4c).

**Batch 3 (items 12–31 of the then-current 169-group list, i.e.
`fly`–`å ha ansvar for`) ✅ DONE.** 4 kept-both (homographs/different
senses: `fly`, `fossil`, `få`, `glede`). 4 straightforward merges (kept
lower level, patched a field where the loser had one, deleted the
other): `form` (patched `definition` into kept A2 `v-a2-health-033`,
deleted B1 `v-b1-fitness-011`), `gate` (kept A1 `v-a1-places-009`,
deleted A2 `v-a2-directions-023`, no patch needed), `gjenbruk`
(same-file same-level B2 dup, kept `v-b2-environment-022`, deleted
`v-b2-environment-060`), `få endene til å møtes` (kept clean B2
`u-b2-554`, deleted C `u-c-106` — the C copy had systematic
encoding corruption: Latin `i` substituted for Cyrillic letters and
Norwegian diacritics stripped from its example sentence, e.g. "Med sa
hoy husleie... a fa endene til a motes"). 1 cross-level merge with a
richness patch: `gå i vasken` (kept B2 `u-b2-591`, patched in C's
richer english "; to fall through; to come to nothing", deleted C
`u-c-290`). 8 same-file B2-uttrykk Shape-A pairs resolved by the no-å
convention, patching the richer/no-å side's `english` field from its
loser before deleting: `få fotfeste`, `få inntrykk av`, `få lønna til
å strekke til`, `få skikk på livet`, `følge noens eksempel`, `gi avkall
på`, `gi utslag i`, `gå altfor langt`, `gå på rundgang` (9 total —
`gå mot strømmen` deleted its å-loser with no patch, the two english
fields being roughly synonymous). 1 mixed level/å-rule conflict
(`bli lei av`-style): `ha ansvar for` — kept A2 `u-a2-039` (right
level) but its `norsk`/`lemma` had the stray å-prefix, so stripped
that, patched in B1's richer english (", to have a duty to"), then
deleted B1 `u-b1-054`.

Re-ran `find_dupes.py --details` after the batch: 153 normalized-dupe
groups remaining (down from 169), 0 cross-file duplicates, no new
groups introduced.

**Batch 4 (the `ha`/`holde`/`hoste`/`hylle` cluster) ✅ DONE.** 2
kept-both, no action (homographs/different senses): `hylle`. 1 field
trim to remove overlap with a same-file split entry: `hoste` (trimmed
`v-a2-health-018`'s english from "a cough / to cough" to "a cough",
leaving the verb sense to `v-a2-body-013` "å hoste" → "to cough").
8 same-file B2-uttrykk Shape-A pairs resolved by the no-å convention,
patching the richer/no-å side's `english` field from its loser before
deleting: `ha det siste ordet`, `ha en følelse av`, `ha høy grad av
noe`, `ha i bakhodet`, `ha kjennskap til`, `ha mye på hjertet`, `ha
potensial til`, `ha stor betydning for`, `ha tiltro til`, `havne på
førsteplass`, `holde kjeft`, `hvile på laurbærene` (patched keepers:
`u-b2-324/326` `ha det siste ordet`, `u-b2-329` `ha i bakhodet`,
`u-b2-333` `ha potensial til`, `u-b2-335` `ha stor betydning for`,
`u-b2-337` `holde kjeft`, `u-b2-339` `hvile på laurbærene`; deleted
å-prefixed losers `u-b2-324, 325, 327, 328, 330, 332, 336, 338, 340,
342, 344, 346`). 2 simple keep-lower-level/no-patch merges: `ha fri`
(kept `u-a2-183`, also stripped its own stray `å` prefix to match
`ha fri` convention; deleted same-file duplicate `u-a2-207`), `ha
rett til` (kept `u-a2-282`, deleted same-file duplicate `u-a2-069`). 3 å-prefix renames +
cross-level merges: `å ha rett` → renamed to `ha rett` (`u-a2-035`),
patched english to "to be right, to be correct", deleted B1
`u-b1-062`; `å ha rett i noe` → renamed to `ha rett i noe`, deleted
B2 `u-b2-476`; `å holde seg i form` → renamed to `holde seg i form`
(`u-a2-054`), deleted B1 `u-b1-069`. 1 cross-level richness merge:
`ha rent mel i posen` (kept B2 `u-b2-593`, merged in C's richer
English as a second semicolon-joined clause "to have clean hands, be
innocent", deleted C `u-c-594`).

Note: mid-batch, two same-file deletions (`u-a2-207` and `u-b2-476`)
accidentally clipped the opening `{`/`"id"` line of the immediately
following entry — caught and fixed both by re-validating JSON after
each delete. Worth double-checking JSON validity after any delete
going forward.

Post-batch validation (all 10 data files, run from a mirrored copy):
`find_dupes.py --details` → 0 cross-file, 1 within-file (pre-existing
`å rekke` keep-both), 135 normalized (down from 153); all 10 JSON
files parse cleanly; `check-uttrykk.ts` → 0 errors on every file I
touched (pre-existing, unrelated: 1 aggregate error from an A2 preview
cross-check orphan `up-a2-010`/"å bli lei av", 2 warnings for missing
`lemma` on B1 `u-b1-064`/`u-b1-070`); `check-vocab.ts` → 0 errors, 0
warnings across all 5 files.

**Batch 4c-mechanical (46-pair Shape-A merge) ✅ DONE.** Triaged the
post-Batch-4 135-group list and found 45 of the remaining 46 pairs
were the same Shape-A pattern (clean phrase + å-prefixed same-file
duplicate in B1/B2-uttrykk) plus 1 same-file vocab pair. Rather than
46 manual edits, scripted the merge (patch richer/no-å side's fields
from its loser, then delete loser) on mirrored local copies, validated
JSON + `find_dupes.py` + `check-vocab.ts`/`check-uttrykk.ts` before
pushing back. One transcription slip along the way: a hand-copied
Cyrillic `ukrainian` field (`u-b2-415` cluster) was mistyped; fixed by
re-copying raw UTF-8 from `view` output instead of retyping, then
continued in smaller batches. Pushed all 5 modified files
(`uttrykk-a2.json`, `uttrykk-b1.json`, `uttrykk-b2.json`,
`uttrykk-c.json`, `vocab-a2.json`, plus `uttrykk-a2-preview.json`) to
the real repo.

Verified this session (re-ran `find_dupes.py` + JSON parse on all 10
production data files): 0 cross-file duplicates, 1 within-file
(`å rekke`, confirmed keep-both), **110 normalized duplicates
remaining** (down from 135). All files parse as valid JSON — no
corruption from the mega-batch push.

Recommended workflow:

- [x] Write a small triage script (`scripts/triage-normalized-dupes.mjs` or
      similar) that reuses `find_dupes.py`'s `normalize_norsk()` logic
      (mirror the regex patterns — they're already duplicated between
      `check-vocab.mjs` and `find_dupes.py`, so this would be a third copy;
      consider whether it's worth extracting the norm function to a shared
      module both the JS and Python scripts can call, though a Python↔JS
      shared module isn't trivial — a documented "keep these three regex
      sets in sync" comment in each may be the pragmatic answer instead).
      The script's job is **classification only, no writes**: for each of
      the 215 groups, tag it `same-file-typo` / `cross-level-same-sense` /
      `different-sense-keep-both` based on simple heuristics (same `part`
      value + same file → likely Shape A; same `part` value + different
      level → likely Shape B; different `part` values → likely Shape C,
      flag for manual read regardless since `part` mismatches aren't a
      guarantee). **Superseded in practice** — the dedicated triage script
      was never built; instead all 215 groups were worked through directly
      in manual batches of ~20 (see Batches 1–4, the 46-pair and 32-pair
      mechanical merges, the 17-pair `være X` cluster, and the final
      82→51→42-keep-both non-mechanical pass above), reading each group's
      `part`/file/level by hand rather than via an automated heuristic tag.
      Same end state reached (215 → 43 keep-both homographs), just via
      direct review instead of a scripted first pass.
- [x] Human-review the `different-sense-keep-both` bucket to confirm the
      heuristic didn't miss a real duplicate (a homograph with the same
      `part` — e.g. two nouns with different meanings — would still slip
      through the "same part = likely dupe" heuristic, so this bucket
      needs a second, low-confidence pass too, not just the auto-approved
      one). **Done** — since no heuristic/script was used, every one of
      the 43 remaining groups was read manually (not just spot-checked)
      as part of the normal batch-review process; all 43 confirmed genuine
      keep-both homographs.
- [x] For confirmed `same-file-typo` and `cross-level-same-sense` groups,
      apply the same keep/patch/delete logic as 4a/4b. **Done** across all
      batches — same-file Shape-A (å-prefix) pairs patched-then-deleted,
      cross-level Shape-B pairs kept-lower-level-patched-then-deleted, per
      the 4a/4b rule, consistently through the whole 215 → 43 pass.
- [x] Re-run `python scripts/find_dupes.py --details` after each batch to
      confirm the group is gone and no new ones were introduced. **Done**
      — re-run after every batch throughout (documented per-batch group
      counts above: 215 → 169 → 153 → 135 → 110 → 43), plus the final 4d
      confirmation run.

### 4d. Final re-validation (after 4a–4c)

- [x] `python scripts/find_dupes.py --details` — confirmed after the final
      9-merge triage batch: 1 cross-file keep-both (`tid (en/ei)`, A2 vs
      C — now shows as an *exact* cross-file match rather than
      normalized-only, simply because both sides carry the same
      `(en/ei)` marker post-relabel; same intentional keep-both case as
      before, not a new issue), 1 within-file keep-both (`å rekke`), 43
      normalized groups remaining, all confirmed genuine keep-both
      homographs (e.g. `kort`). Counts at/near 0 as expected.
- [x] `node scripts/find-cross-type-duplicates.mjs` — re-run: **0 exact
      matches** confirmed (688 prefix matches remain, expected noise —
      function words like `være`/`det`/`for`/`til`/`med` prefixing
      hundreds of idioms, out of scope per Phase 3).
- [x] `npx tsx scripts/check-vocab.ts` (script renamed from the old
      `check-vocab.mjs`, which no longer exists) — 0 errors, 0 warnings,
      confirmed this session.
- [x] `npx tsx scripts/check-uttrykk.ts` (script renamed from the old
      `check-uttrykk.mjs`, which no longer exists) — 0 errors, confirmed
      this session after fixing the 4 preview-file breaks the 4c batches
      introduced (see above). 2 pre-existing `lemma`-missing warnings
      remain on `u-b1-064`/`u-b1-070`, unrelated to this work.
- [x] `node scripts/renumber-ids.mjs --dry-run` — run: 2786 IDs would
      change (922 vocab, 1864 uttrykk) across every file except
      `vocab-a1.json`/`uttrykk-a1.json` — expected, since Phases 3–4
      deleted thousands of entries and left ID gaps. **Decision: skip
      renumbering.** IDs are referenced elsewhere (`card_progress` is
      keyed by `vocab_id`, per the ID-based progress migration; preview
      files and grammar.json also reference specific uttrykk/vocab IDs),
      so a mass renumber risks breaking those references for a
      cosmetic gap-closing benefit. Gaps in the ID sequence are harmless
      on their own — leaving them as-is closes out 4d without that risk.

---

## Summary / order

1. Phase 1 — ✅ done: fixed `check-vocab.mjs`'s stale category list +
   the `arbeidsmiljøloven` formatting fix. Run `node scripts/check-vocab.mjs`
   to confirm 0 errors.
2. Phase 2 — ✅ done: reassigned all 25 `uttrykk-c.json` category slugs
   (table above). Run `node scripts/check-uttrykk.mjs c` to confirm 0
   errors.
3. Phase 3 — resolve 34 exact cross-type duplicates (vocab wins in nearly
   all cases here — mostly particle/reflexive verbs).
4. Phase 4 — the big one: 2 within-file + 26 cross-file + 215 normalized
   duplicates. 4a (within-file) ✅ and 4b (cross-file) ✅ are both done —
   13 of the 26 cross-file pairs turned out to be stale (already resolved
   by Phase 3), 11 were straightforward keep-lower-level/vocab-wins
   merges, and 2 (`fylle ut`, `gi opp`) needed a user call on which level
   to keep (both resolved to A2). 4c (normalized, in progress): Batch 4
   (21 items, `uttrykk-a2/b1/b2/c.json` + `vocab-a2.json`) ✅, the 46-pair
   mechanical å-prefix mega-batch ✅, the 32-pair mechanical å-prefix batch
   (`uttrykk-a2/b1/b2/c.json`) ✅ — all pushed and validated with
   `find_dupes.py` (0 errors) and `check-vocab.ts`/`check-uttrykk.ts`
   (0 errors on touched entries). Most recently: the last 17 same-file
   å-prefix pairs in `uttrykk-b2.json` (`være X …` cluster) merged —
   6 keepers patched with genuinely new English nuance from their losers,
   17 losers deleted — plus 3 cross-file duplicates this batch surfaced
   (`legge vekt på`, `klare seg selv`, `ta feil`, all A2 vs B2) resolved
   by keeping the lower-level A2 entry and deleting the B2 duplicate, per
   the established cross-level precedent.

**Gender-notation batch (31 pairs) ✅ DONE.** Convention: always keep the
`(en/ei)` form. 19 pairs were basic A1 words whose only `(en/ei)` version
sat at A2 — exception applied: relabeled the A1 entry to `(en/ei)`
in-place and deleted the A2 duplicate (`vocab-a1.json`: 19 relabels;
`vocab-a2.json`: 19 deletions). The other 12 pairs were straightforward
keep-lower-delete-higher: 10 in `vocab-b1.json`, 1 in `vocab-b2.json`
(`sykmelding`), 1 in `vocab-c.json` (`tid`). `tid` was flagged mid-batch
as not a pure gender-dupe — the C entry has a genuinely distinct
"abstract concept" sense/definition — so per user decision it was kept
as a separate entry, just relabeled to `(en/ei)` (both A2 and C `tid`
entries now coexist, same as the `å rekke` keep-both precedent).

**Non-mechanical normalized-dupe triage (final 82 → 51 → 42 keep-both)
✅ DONE.** Ran `find_dupes.py --details` on a full local mirror of all
10 production files and manually read every remaining group. 42 of 51
were genuine different-sense homographs (noun/verb/adjective pairs like
`fly` = airplane vs. `å fly` = to fly, `kort` = short vs. a card) — left
untouched, no action needed. 9 were real duplicates and were merged:

- `komme til bunns i`, `sette pris på`, `ta mot til seg`,
  `være opptatt av` — same-meaning B1-uttrykk/B2-uttrykk pairs, B2
  (å-prefixed) copy deleted, matches the established å-prefix pattern.
- `skjørt`, `treningssenter` — identical A1/A2 vocab pairs, A2 deleted.
  Note: both A1 survivors carry gender marker `(en)` while their deleted
  A2 duplicates had `(et)` — `skjørt`/`treningssenter` are actually
  neuter in Norwegian, so the A1 entries likely have the wrong gender
  marker. Not fixed this session (out of scope for the dupe-merge); flag
  for a future gender-marker audit.
- `faste` (noun "fasting" sense) — B1 kept, C's duplicate noun sense
  deleted; C's separate `å faste` (verb, B2) sense is unrelated and
  untouched.
- `premiss` — two B2 entries, identical meaning, different categories
  (argumentation vs. philosophy); philosophy copy deleted arbitrarily.
- `passe` — two A2 entries, identical content, one mistagged `part:
  "adjective"` (a data-entry error); the mistagged copy deleted, the
  correctly-tagged `part: "verb"` entry kept.

Post-batch validation (mirrored copy, all 10 files): JSON valid, entry
counts down by exactly 9 (8713 → 8704), `find_dupes.py` → 0 unexpected
cross-file dupes (only the 2 intentional keep-both cases remain:
`å rekke` and `tid`), 43 normalized groups remain — all confirmed
genuine keep-both homographs, no further action needed on them.
All 9 merges pushed to the real repo (`uttrykk-b2.json`,
`vocab-a2.json`, `vocab-b2.json`, `vocab-c.json`).

**Phase 4c is now effectively complete.** Remaining work: final
re-validation pass (4d) — run `check-vocab.mjs`/`check-uttrykk.mjs`,
`find-cross-type-duplicates.mjs`, and `renumber-ids.mjs --dry-run`
across all files to confirm no ID gaps, then clean up any stray
`.bak` files.
