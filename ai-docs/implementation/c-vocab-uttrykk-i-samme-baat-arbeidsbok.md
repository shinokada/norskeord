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

## Phase 3 — Duplicate check ✅ Done

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
- [x] Assign `id` (`v-c-{category}-NNN` / `u-c-NNN`) — **done**, see
      Phase 4.75 below (1487/1487 vocab + 97/97 uttrykk, 0 collisions).

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

- [x] Applied both categories of fixes to `draft/c/vocab-c-new.json` /
      `draft/c/uttrykk-c-new.json` (done in an earlier session — the
      checkboxes above were stale; verified against the real files
      2026-08-09).
- [x] Re-ran `check-vocab.mjs c --draft c` / `check-uttrykk.mjs --draft c`
      — confirmed 0 errors, 0 warnings on both real files.

**Phase 4.5 complete.**

## Phase 4.75 — Assign IDs (`assign-ids.mjs`) ✅ Complete

`uttrykk-c-new.json`: all 97/97 entries have IDs (u-c-848–u-c-944),
confirmed clean.

`vocab-c-new.json`: 1487 entries total. Found (again) the same
in-draft-ID bug noted in an earlier session's `assign-ids.mjs` fix — the
fix was never written back to the real script, so it only ever existed
in a sandbox copy. Recomputed max-ID-per-category from **both**
`src/lib/data/vocab-c.json` (production) and the entries already
assigned within the draft file, then assigned real `id` values
(`v-c-{category}-{NNN}`) to the remaining unassigned entries — 0
collisions, verified against a sandbox copy before writing anything back.

- [x] Assigned real IDs to all 606 originally-unassigned vocab entries,
      applied to `draft/c/vocab-c-new.json` via surgical `edit_file`
      batches (matched on the unique `norsk` field per entry). A stray
      60 entries turned up empty after the first pass (from a stale
      snapshot used to compute the batch list) — assigned and applied
      those too in a follow-up pass.
- [x] Re-ran `check-vocab.mjs c --draft c` on the real file: **1487/1487
      entries have unique valid IDs, 0 errors, 0 warnings.** Phase 4.75
      complete as of 2026-08-09.
- [ ] Fix the real `scripts/assign-ids.mjs` itself (confirmed still
      unfixed as of 2026-08-09 — `assignVocabIds()` computes
      `maxByCategory` only from `prodEntries`, never from IDs already
      assigned within the draft file) so this bug doesn't recur a third
      time. Deferred — not blocking Phase 5; tracked as follow-up tech
      debt, not part of this workbook's scope.

**Phase 4.75 complete** (the `assign-ids.mjs` fix above is deferred
tech debt, not a blocker).

## Phase 5 — Merge & validate

- [x] Appended `vocab-c-new.json` (1486 entries) into
      `src/lib/data/vocab-c.json` (740 → 2226) and `uttrykk-c-new.json`
      (97 entries) into `src/lib/data/uttrykk-c.json` (833 → 930), via
      `merge-to-production.mjs c`. Both `.bak` files written, both draft
      files renamed to `.merged`. 2026-08-09.
- [x] `check-vocab.mjs`, `check-uttrykk.mjs` — **clean for everything
      touched by this workbook.** `vocab-c.json`: 0 errors. The 12
      errors in `vocab-a1.json`/`vocab-b2.json` and 25 errors in
      `uttrykk-c.json` (all on pre-existing IDs u-c-643–u-c-745) are
      unrelated pre-existing issues, not from this merge — the new
      u-c-848–u-c-944 range validates clean.
- [x] `find-cross-type-duplicates.mjs`, `find_dupes.py --details` —
      ran; almost all of the 743/26/2/215 flagged items are
      pre-existing cross-level noise. Found and resolved the one true
      duplicate introduced by this merge: `v-c-psychology-advanced-043`
      (vocab, "være ved sine fulle fem") duplicated `u-c-871` (uttrykk,
      "ved sine fulle fem") — same idiom, no citable single-word head,
      so per the vocab-vs-uttrykk decision rule the vocab entry was
      removed from `vocab-c.json` (2226 → 2225), uttrykk entry kept.
- [x] `renumber-ids.mjs` — run for real (not just C, all levels) on
      2026-08-09. 2726 IDs changed total (756 vocab, 1970 uttrykk).
      Safe because `card_progress` in Supabase only had rows for the
      user's own account, which was truncated beforehand — no other
      users had progress tied to the old IDs. Verified after: `vocab-c.json`
      (2225 entries) and `uttrykk-c.json` (930 entries) both have
      unique, fully sequential per-category/per-file IDs.
- [x] Note remaining translation placeholders for the follow-up
      translation pass. **Scanned `vocab-c.json` and `uttrykk-c.json`
      for empty/missing fields across all translation and definition
      keys (english, ukrainian, spanish, german, examples, definition):**
      `vocab-c.json` — fully clean, 0 missing fields. `uttrykk-c.json` —
      204 entries (`u-c-178`–`u-c-381`, one contiguous pre-existing
      block, unrelated to this workbook's new entries) are missing the
      `definition` field. Flagged here for a future cleanup pass, not
      blocking.

**Phase 5 complete. Workbook complete** — all 1583 new C-level entries
(1486 vocab + 97 uttrykk) are merged into production, validated, and
renumbered.

## Follow-up — pre-existing `definition` gap in `uttrykk-c.json`

Not part of this workbook's scope, but tracked here since it was found
during Phase 5's placeholder scan. The 204 pre-existing entries
(`u-c-178`–`u-c-381`) missing the `definition` field have now been
filled with Norwegian-only definitions, written directly to
`src/lib/data/uttrykk-c.json` in 4 surgical batches (anchored on each
entry's unique `example_german` line, inserted before `level` to match
existing field order). Verified after: 930/930 entries have a
`definition`, all IDs unique. 2026-08-09.
