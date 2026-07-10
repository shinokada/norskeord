# Vocab ↔ Uttrykk Reclassification Workflow

Companion to `data-rules/vocab-and-uttrykk.md`. Covers steps 2–5 of the
original plan: audit → resolve cross-type duplicates → classify → migrate →
validate. Follow in order — the ordering matters (see the note in Phase 2).

Scripts referenced: `find-cross-type-duplicates.mjs`, `classify-vocab-phrases.mjs`,
`classify-uttrykk-verbs.mjs`, `migrate-type-a-to-uttrykk.mjs`, `migrate-to-vocab.mjs`,
`check-vocab.mjs`, `check-uttrykk.mjs`, `find_dupes.py`, `renumber-ids.mjs`.

---

## Phase 1 — Cross-type duplicates (no API cost, do this first)

```bash
node scripts/find-cross-type-duplicates.mjs
```

Open `scripts/output/cross-type-duplicates.md`. There are **38 known exact
matches** from the preview run (e.g. `ved siden av`, `kle på seg`, `råd`↔`ha
råd til`, `rett`↔`ha rett`).

For each exact match, apply the decision rule from `vocab-and-uttrykk.md`:

- [ ] Does it function as a lexical item (inflects/conjugates, single
      grammatical head)? → **keep the vocab entry, delete the uttrykk entry.**
- [ ] Is it primarily a fixed chunk with no single grammatical head? → **keep
      the uttrykk entry, delete the vocab entry.**
- [ ] Genuinely ambiguous / both worth keeping as distinct cards? → leave
      both, note it, move on — don't force a call you're not sure of.

Practical way to work through the list: go row by row in the markdown table,
decide winner/loser, then delete the loser directly from its JSON file
(small manual edit — at 38 entries this is faster than scripting it). Keep a
running note of what you deleted in case you want to `git diff` later.

**Skip the "Prefix Matches" table** — reviewed the preview run, it's ~605
mostly-noise matches (`være`, `god`, `takk` naturally prefix lots of unrelated
uttrykk entries). Only worth a skim if you're curious, not part of this
workflow.

- [ ] Re-run `find-cross-type-duplicates.mjs` after deleting losers — exact
      match count should now be near 0 (a couple of legitimate keep-both
      cases may remain).

**Why this has to happen before Phase 2:** some of these 38 duplicates
(`kle på seg`, `føle seg`, `slå av`, `snakke med`, `slappe av`, etc.) will
_also_ get flagged by `classify-uttrykk-verbs.mjs` as `move_to_vocab`
candidates, because they contain "seg" or a particle. If you classify and
migrate before resolving duplicates, you risk creating a _second_, worse
duplicate — the uttrykk copy gets migrated into vocab as a new entry,
sitting alongside the vocab entry that already existed. Deleting the loser
first means the classifier never sees it.

---

## Phase 2 — Classify

```bash
node scripts/classify-vocab-phrases.mjs
node scripts/classify-uttrykk-verbs.mjs
```

Needs `ANTHROPIC_API_KEY` in `.env`. Estimated cost: ~$0.11 + ~$0.37 ≈ $0.50
total (see prior estimate). Takes a few minutes — batches run sequentially
with a small delay between them.

Review both reports:

- `scripts/output/phrase-classification.md` (vocab → uttrykk direction)
- `scripts/output/uttrykk-verb-classification.md` (uttrykk → vocab direction)

For each report, in order of confidence:

- [ ] **Skim the high-confidence buckets first** (`type_a`/`type_b` in the
      vocab report, `move_to_vocab`/`stays_uttrykk` in the uttrykk report).
      Spot-check ~10–15%, don't need to verify every row — the model is
      applying the same rule you'd apply by hand.
- [ ] **Read every row in `borderline`.** This is the bucket the heuristics
      and the model both flagged as genuinely unclear — worth your judgment
      call, ideally with NAOB/Bokmålsordboka open for the truly ambiguous
      ones.
- [ ] For anything you disagree with, note the ID — you'll add it to a skip
      list before migrating (see Phase 3).
- [ ] For `uttrykk-verb-classification.md` specifically, also sanity-check
      `suggested_category` on the `move_to_vocab` rows — the model is
      picking from the real `CATEGORIES_BY_LEVEL` list, but "best fit" is a
      judgment call it can get wrong (e.g. a verb that's arguably `health`
      vs `body`).

**Update:** `retag-vocab-parts.mjs` now exists (`scripts/retag-vocab-parts.mjs`).
Run `--dry-run` first, then for real — it only touches the `part` field,
nothing else. Actual `type_b` count came back at 98 (higher than the
original "well under 50" estimate), so automating it was worth it.

**Gotcha found while retagging (check for this in future batches too):**
when a `"phrase"` entry gets retagged to `"noun"`, its `norsk`/`lemma`
fields need to already follow the noun convention (`word (gender)`, no
leading article — see `data-rules/vocab-and-uttrykk.md`). 15 of the 98
type_b entries in this run didn't — mostly borrowed/technical terms typed
as `"en fri vilje"` / `"et nevralt nettverk"` instead of `"fri vilje (en)"`
/ `"nevralt nettverk (et)"` for both `norsk` and `lemma`. One of these
(`v-c-rhetoric-005`, "retorisk spørsmål") also had an outright gender
error (tagged `en`, should be `et`). Fixed by hand this round; worth a
quick scan of the retagged batch for this pattern each time, since
`retag-vocab-parts.mjs` deliberately only changes `part` and won't catch
it.

---

## Phase 3 — Migrate (dry-run first, always)

Add any IDs you disagreed with in Phase 2 to the `SKIP_IDS` set at the top
of the relevant migration script before running it for real.

```bash
# vocab → uttrykk (type_a entries)
node scripts/migrate-type-a-to-uttrykk.mjs --dry-run
# read the printed plan carefully, then:
node scripts/migrate-type-a-to-uttrykk.mjs

# uttrykk → vocab (move_to_vocab entries)
node scripts/migrate-to-vocab.mjs --dry-run
# read the printed plan carefully, then:
node scripts/migrate-to-vocab.mjs
```

Both scripts write `.bak` backups of every file they touch before writing,
same convention as your existing scripts. If anything looks wrong after a
real run, restore from `.bak` before re-running.

- [ ] Dry-run `migrate-type-a-to-uttrykk.mjs`, review the plan
- [ ] Run for real
- [ ] Dry-run `migrate-to-vocab.mjs`, review the plan
- [ ] Run for real

---

## Phase 4 — Re-validate

Run the existing validators, same ones you already use for the C-level
pipeline:

```bash
node scripts/find-cross-type-duplicates.mjs      # should be ~0 exact matches now
python scripts/find_dupes.py --details            # within-file / cross-file dupes
node scripts/check-vocab.mjs                       # ID format, category, part, norsk/lemma rules
node scripts/check-uttrykk.mjs                     # same, for uttrykk
node scripts/renumber-ids.mjs --dry-run            # confirm no ID gaps were introduced
```

- [ ] `find-cross-type-duplicates.mjs` — exact matches back near 0
- [ ] `find_dupes.py --details` — no new within-file dupes introduced by the
      migrations (a migrated entry landing in a category that already has a
      similar entry is the main risk here)
- [ ] `check-vocab.mjs` — clean (migrated entries now live as ordinary
      `part: "verb"` vocab entries; the norsk `å `-prefix formatting is
      applied by `migrate-to-vocab.mjs`, but worth letting the validator
      confirm rather than trusting it blind)
- [ ] `check-uttrykk.mjs` — clean
- [ ] `renumber-ids.mjs --dry-run` — no gaps (both migration scripts assign
      sequential IDs continuing from the existing max, so this should be a
      formality, but cheap to confirm)

If everything's clean, this closes out item 5 from the original plan
("catch other changes from vocab to uttrykk and vice versa"). The two
classifier scripts plus `find-cross-type-duplicates.mjs` are now permanent
tools in `scripts/` — re-run them any time future enrichment batches might
have introduced new misclassified entries (e.g. after each new C-level
image-conversion batch).

---

## Order summary (TL;DR)

1. `find-cross-type-duplicates.mjs` → resolve 38 exact matches by hand
2. `classify-vocab-phrases.mjs` + `classify-uttrykk-verbs.mjs` → review reports
3. `migrate-type-a-to-uttrykk.mjs` + `migrate-to-vocab.mjs` (dry-run → real)
4. Re-run all validators → confirm clean
