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

## Phase 4 — Split into vocab / uttrykk ✅ Done

**Note (2026-08-07):** a first attempt at this phase ran in a previous
session using an ad hoc `enrich-arbeidsbok.mjs` written directly to Claude's
sandbox (`/home/claude/work/`). That sandbox is wiped between sessions and
the script/output were never copied into the project, so ~97/106 batches of
progress were lost when the session ended.

**Note (2026-08-08):** restarted from scratch. `scripts/enrich-arbeidsbok.mjs`
was rewritten (adapted from `scripts/enrich-vocab.mjs`) and written directly
to the real project via the Filesystem connector. Key differences from the
original plan below:

- Output paths are **flat** — `draft/c/vocab-c-new.json` / `draft/c/
  uttrykk-c-new.json` — not nested under `draft/c/i-samme-baat-arbeidsbok/`.
  This matches what `check-vocab.mjs --draft`, `check-uttrykk.mjs --draft`,
  and `assign-ids.mjs` all expect; the nested path was a deviation that had
  to be corrected mid-run (files moved, script's `paths.outVocab`/
  `outUttrykk` updated).
- No intermediate `batches/*.json` files — the script writes the combined
  `vocab-c-new.json`/`uttrykk-c-new.json` directly, flushing to disk after
  **every single batch** (not just at the end of a run), so a `Ctrl+C` or
  crash only costs the in-flight batch. Resumable by `lemma` — rerunning
  the same command picks up wherever it left off.
- Run **locally by the user** (`node scripts/enrich-arbeidsbok.mjs`,
  reading `ANTHROPIC_API_KEY` from `.env`), not batch-by-batch through
  Claude's sandbox — far cheaper and avoids sandbox timeouts entirely.
  Total cost for the full run: ~$5.
- `max_tokens` had to be raised from 4096 → 8192 after batch 1 hit a
  truncated-JSON parse failure (entries here produce richer, multi-sense
  translations than the original `enrich-vocab.mjs` prompt assumed).

- [x] Split `scripts/outputs/arbeidsbok-resolved.json` (1585 entries) by
      `part`: `part == 'phrase'` → 79 uttrykk candidates, `part != 'phrase'`
      → 1506 vocab candidates. (Split happens inside the enrichment script,
      not as a separate file.)
- [x] Built `scripts/enrich-arbeidsbok.mjs` — see notes above for the
      as-built design (differs from the original plan in output path,
      flush frequency, and execution location).
- [x] Ran the script to completion: 1584/1585 enriched in the main run,
      1 entry (`ymte frampå`) silently dropped by a batch-response mismatch
      and picked up on a targeted rerun (resumable-by-lemma made this a
      1-line fix, not a re-run of everything). Final: **1505 vocab-
      candidate entries in `draft/c/vocab-c-new.json`, 79 in
      `draft/c/uttrykk-c-new.json`** (1584 total — `rekke` legitimately
      appears twice as two distinct verb senses, see Phase 3 notes).
- [x] `category` (from the 37 C-level slugs) assigned to vocab **and**
      uttrykk entries alike, per `data-rules/vocab-and-uttrykk.md` (C has
      no generic `uttrykk` category — confirmed via `check-uttrykk.mjs`'s
      own category-validation logic before building the prompt).
- [ ] Assign `id` (`v-c-{category}-NNN` / `u-c-NNN`) — next up, after
      Phase 4.5 cleanup below and a clean `check-vocab.mjs`/
      `check-uttrykk.mjs --draft c` pass.

## Phase 4.5 — Post-enrichment norsk/lemma cleanup 🔄 In progress

`check-uttrykk.mjs --draft c` came back clean (0 errors, 0 warnings, all 79
entries). `check-vocab.mjs c --draft c` found 121 errors + 8 warnings across
1505 entries — all pre-existing formatting gaps from the Phase 2/3 `norsk`/
`lemma` extraction, not enrichment bugs. Two categories:

1. **Mechanical formatting fixes (stay in vocab)** — ~85 `verb` entries
   missing the `å ` prefix (e.g. `gjøre rede for seg` → `å gjøre rede for
   seg`), ~14 `noun` entries missing a gender marker (e.g. `domene` →
   `domene (et)`), a few needing an extraction-artifact trim first
   (`rekkevidden av` → `rekkevidde (en)`, `tyveriet` → `tyveri (et)`, `et
   sett av` → `sett (et)`, `renningen på en spent vev` → `renning (en)`),
   and 4 `lemma`-only warnings (strip gender/plural marker from `lemma`,
   e.g. `hengsel (en/et)` → `hengsel`). Two verb entries needed more than a
   prefix: `utnevnt til` → `å bli utnevnt til` (bare participle needed
   `bli`), `jeg har latt meg fortelle` → `å la seg fortelle` (lemma was
   already correctly reduced; `norsk` wasn't).
2. **Reclassify `vocab` → `uttrykk`** (`part: 'phrase'`, entry moved from
   `vocab-c-new.json` to `uttrykk-c-new.json`) — 19 entries with no single
   grammatical head or citable dictionary form, per the
   `vocab-and-uttrykk.md` decision rule: `det går trill rundt for ham`,
   `magen vrenger seg`, `forventingen blir innfridd` (full clauses with a
   baked-in subject/pronoun), `det aller helligste`, `en svunnen tid`, `et
   sjenerøst hodekast`, `et rødt øre` (note explicitly says "brukes bare
   med ikke" — negation-bound idiom), `leven og spetakkel` (coordinated
   pair, no single head), `på randen`, `uminnelige tider`, `onde tunger`,
   `et vell av`, `(halv)kriminell bane`, `neste post på programmet`, `det
   forjettede land`, `slekters gang`, `et slag under beltestedet`, and
   `erkjennelsen ved havet` (lowercased per user decision — reads like a
   fixed literary/textbook reference, not a general vocab item).

- [ ] Apply both categories of fixes to `draft/c/vocab-c-new.json` /
      `draft/c/uttrykk-c-new.json`.
- [ ] Re-run `check-vocab.mjs c --draft c` / `check-uttrykk.mjs --draft c`
      — confirm 0 errors before moving to `assign-ids.mjs`.

## Phase 5 — Merge & validate

- [ ] Append `vocab-c-new.json` entries into `src/lib/data/vocab-c.json`
      and `uttrykk-c-new.json` into `src/lib/data/uttrykk-c.json`.
- [ ] `check-vocab.mjs`, `check-uttrykk.mjs` — clean.
- [ ] `find-cross-type-duplicates.mjs`, `find_dupes.py --details` — clean.
- [ ] `renumber-ids.mjs --dry-run` — no gaps.
- [ ] Note remaining translation placeholders for the follow-up
      translation pass.

