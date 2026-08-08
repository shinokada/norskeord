---
title: C vocab and uttrykk from I samme båt arbeidsbok
resources: draft/c/i-samme-baat-arbeidsbok/extracted-vocabularliste.json, forklaring-av-ord-og-uttrykk.md
date_started: 2026-08-06
date_completed:
---

## Decisions

- **Gender mapping**: source `(m)` → `(en)`, `(f)` → `(ei)`, `(n)` → `(et)`,
  `(m/f)` → `(en/ei)` (already a valid `GENDER_PATTERN` value in
  `check-vocab.mjs`, no validator change needed). `(m/f/n)` → `(en/ei/et)`
  — added as a new `GENDER_PATTERN` value in `check-vocab.mjs` during batch 8
  (needed for "sot", confirmed valid per ordbokene.no).
- **Non-vocab titles**: a handful of arbeidsbok entries turned out to be
  chapter/section titles from the source text (capitalized, no definition —
  e.g. "Virkelighet", "Intet nytt") rather than real vocab/uttrykk. These are
  dropped entirely (not filled in) when found during the batch review.
- **Translations** (`english`, `spanish`, `ukrainian`, `german`) and
  `example_*` fields: left as placeholders in this pass, filled in a
  separate translation pass afterward.
- New `VocabEntry` fields: `note?: string` (free-text usage note, distinct
  from `definition`) and `verb_type?: string` (conjugation class — `v1`,
  `v2`, `v3`, `ureg`, or a comma-separated combination like `v1, v2`).
- Reuse existing tooling rather than writing new dedup/validation logic:
  `find-cross-type-duplicates.mjs`, `find_dupes.py`, `check-vocab.mjs`,
  `check-uttrykk.mjs`, `renumber-ids.mjs`.

## Phase 1 — Update type & rules ✅ Done

- [x] Add `note?: string` and `verb_type?: string` to `VocabEntry` in
      `src/lib/types.ts`. Confirmed already present (see `note?`/`verb_type?`
      in the interface).
- [ ] Document both fields in `data-rules/vocab-and-uttrykk.md`, including
      the `verb_type` value format and the gender-mapping table above.
      (Not yet confirmed — still open.)

## Phase 2 — Clean up `extracted-vocabularliste.json` ✅ Done

For each entry's `norsk` field:

- [x] Extract gender markers `(n)`, `(m)`, `(f)`, `(m/f)` → map per the
      gender table, move into the `norsk`/`lemma` convention
      (`word (en/ei/et)`).
- [x] Extract verb-form markers (`(ureg.)`, `(v1)`, `(v2)`, `(v3)`, etc.) →
      `verb_type` field, remove from `norsk`.
- [x] Strip trailing `(*)` (and the preceding space) wherever present.
- [x] Add `part` field: `noun`/`verb`/`adjective`/etc. if the entry is a
      single lexical word; `phrase` (or the head's part, per the decision
      rule in `vocab-and-uttrykk.md`) if it's a multi-word expression.
      Ran via `scripts/clean-i-samme-baat-vocab.mjs`: 2,118 entries total,
      1,766 auto-classified (verb 649, adjective 521, adverb 46,
      preposition 4, noun 546), 352 flagged for manual review (no/multiple/
      unrecognized marker, or multi-word noun to double-check). The manual
      review pass is running batch-by-batch (30 entries at a time) as part
      of Phase 3 cleanup below — see `scripts/outputs/arbeidsbok-resolution-log.txt`
      and the in-progress edits to `scripts/outputs/arbeidsbok-resolved.json`.
- [x] Carry the existing `explanation` text into `note` (or `definition` if
      it reads as a monolingual dictionary-style definition rather than a
      usage note — judgment call per entry).

## Phase 3 — Duplicate check 🔄 In progress

- [x] Ran a one-off `find_arbeidsbok_dupes.py` (draft file isn't wired into
      `find_dupes.py`/`find-cross-type-duplicates.mjs` since it's a Phase 2
      output, not the Phase 4 `vocab-c-new.json`) against the cleaned draft
      plus all `vocab-*.json` / `uttrykk-*.json`. Report saved at
      `scripts/outputs/arbeidsbok-duplicate-report.txt`: 295 exact matches,
      55 normalized matches (gender/marker variants — still need manual
      review), 168 within-draft duplicate groups.
- [x] Wrote and ran `scripts/resolve_arbeidsbok_dupes.py`: auto-dropped the
      295 exact production matches and merged the within-draft duplicate
      groups (129 groups, 159 entries folded in via note/definition
      merge). Output: `scripts/outputs/arbeidsbok-resolved.json` (1,664 →
      1,662 after two exclusions below), log in
      `scripts/outputs/arbeidsbok-resolution-log.txt`.
- [x] Fill in `part`/`lemma`/`verb_type` for the 312 entries that came out
      of Phase 2 without a marker (manual batch review, 30 at a time,
      directly editing `scripts/outputs/arbeidsbok-resolved.json`).
      **Done.** All batches complete (12 total). The one known malformed
      entry (`avskum (n); utskudd (n); pakk (n); lømmel (m)`) was split into
      4 separate `VocabEntry` records (avskum/utskudd/pakk/lømmel, each with
      its own gender marker, lemma, and a `note` cross-referencing the other
      3 as synonyms). Working total is now 1626 entries, 0 remaining without
      a `lemma`.
- [x] Review the 55 normalized matches against production (gender/marker
      variants) — decide drop vs. keep-as-distinct-sense. **Done.** 35
      dropped as confirmed 1:1 duplicates, 9 kept as distinct senses (see
      `scripts/outputs/arbeidsbok-resolution-log.txt`). 11 more were false
      positives already excluded earlier. `arbeidsbok-resolved.json`:
      1626 → 1591 entries.
- [x] Resolve any remaining duplicates by hand: drop the draft entry if an
      equivalent already exists, or keep both if genuinely distinct senses.
      **Done.** Re-ran a lemma-based check (now that all 312 batch-review
      lemmas are filled) against every production file. Found 3 more
      duplicates (dropped) and 3 within-draft pairs (merged); 1 genuine
      homograph pair ('rekke') kept as distinct senses. See
      `scripts/outputs/arbeidsbok-resolution-log.txt`. Final
      `arbeidsbok-resolved.json`: 1585 entries, 0 missing lemma.

**Phase 3 complete.**

## Phase 4 — Split into vocab / uttrykk 🔄 In progress

**Note (2026-08-07):** a first attempt at this phase ran in a previous
session using an ad hoc `enrich-arbeidsbok.mjs` written directly to Claude's
sandbox (`/home/claude/work/`). That sandbox is wiped between sessions and
the script/output were never copied into the project, so ~97/106 batches of
progress were lost when the session ended. Restarting from scratch below —
this time the script lives in and writes directly to the real project via
the Filesystem connector, so progress survives session boundaries.

- [x] Split `scripts/outputs/arbeidsbok-resolved.json` (1585 entries) by
      `part`: `part == 'phrase'` → 79 uttrykk candidates, `part != 'phrase'`
      → 1506 vocab candidates. (Split happens inside the enrichment script
      below, not as a separate file.)
- [x] Built `scripts/enrich-arbeidsbok.mjs` (adapted from
      `scripts/enrich-vocab.mjs`): reads `arbeidsbok-resolved.json`,
      calls the Claude API per batch (~15 entries) for `category` (vocab
      only, from the 37 C-level slugs), `english`/`ukrainian`/`spanish`/
      `german`, and `example` + its 4 translations. Preserves existing
      `note`/`definition`/`lemma`/`verb_type`/`part` fields as-is. Writes
      each completed batch to `draft/c/i-samme-baat-arbeidsbok/batches/
      vocab-batch-NNN.json` / `uttrykk-batch-NNN.json`; skips lemmas
      already present in any existing batch file on rerun
      (`--max-batches N`, `--type vocab|uttrykk`, `--dry-run`).
- [ ] 🔄 Run the script to completion (107 batches total: 101 vocab +
      6 uttrykk, at batch size 15). Progress: **2/101 vocab batches done**
      (vocab-batch-001, vocab-batch-002 — 30 entries), 0/6 uttrykk.
      Workflow per batch (since Claude has no shell access to the user's
      machine): run the script in Claude's own sandbox with the project's
      `ANTHROPIC_API_KEY`, spot-check output quality, then write the
      resulting batch file into the real project via the Filesystem
      connector so it survives the session. ~1 batch/tool-call is reliable
      (2+ batches in one call risks a sandbox timeout). Note: the script's
      automatic diacritic correction only catches headword/common-word
      mismatches, not every stray missing accent in generated Spanish
      example sentences — batches 001–002 needed a few manual Spanish
      accent fixes (e.g. salió, habitación, sofá, hábito) before being
      written to the project; worth a full `find-diacritic-issues-all.mjs`
      pass in Phase 5 regardless.
- [ ] Merge all `batches/batch-*.json` → split into
      `draft/c/i-samme-baat-arbeidsbok/vocab-c-new.json` (part != phrase)
      and `uttrykk-c-new.json` (part == phrase).
- [ ] Assign `id` (`v-c-{category}-NNN` / `u-c-NNN`, continuing from the
      current max — confirm with `assign-ids.mjs c --dry-run`) and
      `category` (from `CATEGORIES_BY_LEVEL.C` in `config.ts`).
- [ ] Fill remaining required `VocabEntry` fields so the files are valid
      against the type.

## Phase 5 — Merge & validate

- [ ] Append `vocab-c-new.json` entries into `src/lib/data/vocab-c.json`
      and `uttrykk-c-new.json` into `src/lib/data/uttrykk-c.json`.
- [ ] `check-vocab.mjs`, `check-uttrykk.mjs` — clean.
- [ ] `find-cross-type-duplicates.mjs`, `find_dupes.py --details` — clean.
- [ ] `renumber-ids.mjs --dry-run` — no gaps.
- [ ] Note remaining translation placeholders for the follow-up
      translation pass.

