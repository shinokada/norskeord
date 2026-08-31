# New Vocab/Uttrykk Pipeline — from a plain markdown list

Goal: type/paste a raw list of Norwegian words or expressions into a markdown
file and turn it into merged, schema-valid entries in
`src/lib/data/vocab-{level}.json` / `uttrykk-{level}.json`, with a manual
checkpoint after every stage that can actually surface a problem — Stage 2
auto-continues when its report is clean (see Stage 2 below).

This deliberately reuses the existing Method 2 pipeline
(`ai-docs/instructions/work-flow.md`) wherever possible — the intermediate
file formats already match, so `enrich-vocab.mjs`, `assign-ids.mjs`, and
`merge-to-production.mjs` run unmodified. Two new scripts fill the gap
between "raw list" and "Step 1 extraction output."

## Gaps vs. the original 6-item list

The original list (create md → dedupe → level → classify → build json →
merge) skips steps the schema and existing pipeline both require:

- **Category** — needed for the vocab ID format (`v-{level}-{category}-{NNN}`),
  not just level.
- **Enrichment** — `english`, `example`, `example_english`
  (+ `spanish`/`ukrainian`/`german` + their `example_*`) are effectively
  required by `VocabEntry`; classification alone doesn't produce these.
- **ID assignment** — a distinct step, after validation, before merge.
- **Schema validation** (`check-vocab.ts` / `check-uttrykk.ts`,
  diacritics check) — catches format errors dedup won't.
- **"Similar" duplicates** — `find_dupes.py` only catches exact/normalized
  matches, not near-duplicates (synonyms, same lemma different sense).
  Needs a new, separate pass.
- **Cross-type duplicates** — a new item might already exist as the
  _other_ type (e.g. you list `ta hensyn til` as uttrykk but it's already
  a vocab verb entry). `find-cross-type-duplicates.mjs` exists but runs
  against production only; needs to also see the new batch.

**Note:** on the user's machine Claude works via the Filesystem tool
(read/write) only — no shell/exec access there. Claude does have
exec/bash access on its own separate sandbox, which is used only as
scratch space (e.g. copying a large production file over via
`copy_file_user_to_claude` to compute something too big to scan by eye —
see Stage 5). Any step below that names a script (`enrich-vocab.mjs`,
`check-vocab.ts`, etc.) is the reference implementation; where a stage
says Claude does it in-chat, that script is never actually invoked —
Claude replicates its logic by hand instead and you don't need to run it
yourself.

## Pipeline

```
draft/new-entries/{batch}/
  source-list.md              ← you type/paste this
  classified.json             ← Stage 1 output (checkpoint 1)
  dup-report.md                ← Stage 2 output (checkpoint 2 only if flagged, no file changes)
  extracted-vocab-{level}.json     ← Stage 1 output, existing Step-1 format
  extracted-uttrykk-{level}.json   ← Stage 1 output, existing Step-1 format
  vocab-{level}-new.json           ← Stage 3 output (checkpoint 3)
  uttrykk-{level}-new.json         ← Stage 3 output (checkpoint 3)
```

### Stage 0 — Source list (you)

Free-form markdown, one entry per line. Anything you already know is
optional and picked up if present; the classifier fills in what's missing.

```
- kle på seg
- ta hensyn til [uttrykk, B1]
- nevralt nettverk (et) — kunstig intelligens?
- pytte
```

### Stage 1 — Classify (done in-chat by Claude, no API)

No API calls here — batches are small enough that Claude (in this Desktop
chat) reads `source-list.md` directly and classifies each entry itself,
applying `data-rules/vocab-and-uttrykk.md` by hand. Determines per entry:

- `type`: vocab | uttrykk (decision rule from data-rules)
- `level`: A1–C (use given level if present in the source line; otherwise
  infer from frequency/complexity, flag low-confidence guesses for review)
- `part` (vocab only)
- `category` (vocab only — pass current `CATEGORIES_BY_LEVEL` distribution
  from production so it favors under-represented categories, same as
  Step 2 of the image pipeline)
- `norsk` / `lemma`, normalized per data-rules formatting tables
- `definition` (B1+ words only, per existing convention)

Claude writes the results directly (via the Filesystem tool), split by
level, into the **existing Step-1 extraction format**
(`extracted-vocab-{level}.json` / `extracted-uttrykk-{level}.json`) so
Stage 3 can reuse `enrich-vocab.mjs` unchanged.

**Checkpoint 1:** review `classified.json` (or the extracted-*.json files
directly) against the source list — same ~1 min/entry eyeball as Step 1.5
in the existing workflow. Fix `norsk`/`lemma`/type/level/part by hand.

### Stage 2 — Duplicate check (new script: `dedupe-new-entries.mjs`)

Three passes, all read-only (writes a report, never edits files):

1. **Exact/normalized**, reusing `find_dupes.py`'s normalization logic,
   comparing the new batch against `src/lib/data/vocab-*.json` /
   `uttrykk-*.json` **and** within the batch itself.
2. **Cross-type**, extending `find-cross-type-duplicates.mjs`'s approach to
   also check the new batch's uttrykk entries against production vocab
   lemmas and vice versa.
3. **Similar** (new capability) — fuzzy match on `lemma` (edit distance +
   shared-stem heuristic) against production, surfaced as a markdown table
   for manual judgment call, not auto-resolved. This is inherently
   approximate; false positives are expected and fine since it's a review
   list, not a filter.

Output: `dup-report.md`, same row-by-row review style as the existing
cross-type-duplicates report.

**Checkpoint 2 (conditional):** if the report is clean (no cross-type hits,
no fuzzy matches worth a second look), auto-continue to Stage 3 — a batch
of only-new-word confirmations turned out to be pure rubber-stamping in
practice (batch 01: zero real hits, report reviewed and immediately
approved as-is). If the report _does_ flag something, stop and work
through it — delete/merge/rename entries in `classified.json` before
enrichment. Nothing is auto-deleted either way.

### Stage 3 — Enrich (done in-chat by Claude, no script, no API)

Claude has no exec access, so `enrich-vocab.mjs` itself is never run as
part of this pipeline. Instead, Claude reads the cleaned
`extracted-vocab-{level}.json` / `extracted-uttrykk-{level}.json` for this
batch and enriches each entry by hand — translations, examples, category,
B1+ definitions — applying the same schema/rules the script uses (check
a prior batch's output for the exact shape). Written straight to this
batch's working directory: `draft/new-entries/{batch}/vocab-{level}-new.json`
/ `uttrykk-{level}-new.json`.

(For reference: if you _do_ want to run the real script yourself, note it
reads from a fixed `draft/{level}/extracted-vocab-{level}.json` — not a
per-batch path — so running it as-is can collide with other in-progress
work at that level. That's why Stage 3 is done in-chat instead.)

**Checkpoint 3:** spot-check translations/examples, same as existing
convention.

### Stage 4 — Validate (done in-chat by Claude, no script)

Claude has no exec access on the user's machine (Filesystem tool only,
read/write — see the note above), so `find_dupes.py`,
`find-diacritic-issues-all.mjs`, `check-vocab.ts --draft`, and
`check-uttrykk.ts --draft` are never actually run as part of this
pipeline, even though they're the reference implementation. Instead,
Claude reads those scripts' logic directly (already in context from
implementing/reading this pipeline) and replicates each check by hand
against `vocab-{level}-new.json` / `uttrykk-{level}-new.json` in the
batch's `draft/new-entries/{batch}/` directory: required fields, ID
format (still `""` pre-Stage-5), level/category/part validity against
`CATEGORIES_BY_LEVEL`, `norsk`/`lemma` formatting rules, translation/
example-language pairing, B1+ `definition` presence, and a manual
diacritics sweep (æøå / üöäß / áéíóúñ¿¡) across every language field.

Written to `draft/new-entries/{batch}/validation-report.md` (see batch
03's or 04's for the exact shape/tone to match).

**No new checkpoint needed here** — same as the script-based version,
failures block automatically (Claude fixes what it can, flags anything
that needs a judgment call, same as any other checkpoint). If Claude
does spot something a human should weigh in on (e.g. an ambiguous sense
pick carried over from Stage 3), it's called out in the report and
Claude waits for a decision before Stage 5 rather than guessing.

### Stage 5 — Assign IDs (done in-chat by Claude, no script)

Same constraint as Stage 4 — `assign-ids.mjs` is the reference logic but
is never actually run here. Claude computes IDs itself, matching the
script's algorithm exactly:

1. Copy the relevant production file(s) (`src/lib/data/vocab-{level}.json`
   / `uttrykk-{level}.json`) from the user's filesystem to Claude's own
   sandbox with `copy_file_user_to_claude`, then use `bash_tool` (e.g. a
   short Python/`jq` pass) to find, per category (vocab) or per level
   (uttrykk), the highest existing `NNN` — these files are too large to
   scan reliably by eye or by reading them whole into context.
2. For each batch entry with `id: ""`, assign the next sequential `NNN`
   for its category/level: `v-{level}-{category}-{NNN}` (vocab, 3-digit
   zero-padded) or `u-{level}-{NNN}` (uttrykk). Entries that already have
   an id are left untouched.
3. Sanity-check the computed IDs against the full set of production IDs
   (not just the max) to rule out a gap-filled collision, exactly as the
   script does before writing.
4. Back up the draft file to `{file}.bak` in the batch directory (via the
   Filesystem tool, on the user's machine — matches the script's `.bak`
   convention) before writing the ID-assigned version over the original.

Production files are only ever read (via the temporary sandbox copy),
never written, in this stage.

### Stage 6 — Merge (done in-chat by Claude, no script)

Same constraint as Stages 4/5 — `merge-to-production.mjs` is the
reference logic but is never actually run by you; Claude performs the
merge directly via the Filesystem tool, matching the script's behavior
exactly.

**Reads straight from the batch's own working directory** —
`draft/new-entries/{batch}/vocab-{level}-new.json` /
`uttrykk-{level}-new.json` — never copied to the fixed `draft/{level}/`
path the script itself expects. That copy was only ever needed so *you*
could run `merge-to-production.mjs` yourself (it hardcodes that path);
since Claude does the merge in-chat instead, the copy step is skipped
entirely. Doing it the old way left stray `.bak`/`.merged` files in
`draft/{level}/` that collided across batches (hit this with batch 04's
`vocab-b1-new.json.merged` clashing with batch 03's) — reading directly
from the batch directory avoids that clutter and keeps every artifact for
a batch under its own `draft/new-entries/{batch}/` folder.

1. Safety checks first, same as the script: every draft entry has a
   non-empty `id`, no duplicate `id` within the draft file, no draft `id`
   already present in production (checked against the full production ID
   set, not just the computed max — reuses the sandbox copy from Stage 5
   if still current, otherwise re-copies via `copy_file_user_to_claude`).
   Lemma collisions with production are reported as a warning, not
   blocking, same as the script.
2. Back up the production file: copy `src/lib/data/{kind}-{level}.json`
   to `{kind}-{level}.json.bak` (via the Filesystem tool, overwriting any
   previous `.bak`, matching the script's convention) before touching it
   — **when the file is small enough to read whole into context.** In
   practice most production files (`vocab-a2.json` at 594 KB,
   `vocab-b1.json` at 1.69 MB, etc.) are not — `read_text_file` errors out
   with "too large for context" on them, and there's no user-side
   copy/duplicate tool, only `move_file` (rename). For those, skip the
   `.bak` and rely on git (`git diff` / `git status`) as the safety net
   instead — same reasoning the original pre-Stage-6-automation version
   of this doc used, just now scoped to "whenever `.bak` isn't practically
   possible" rather than "never."
3. Append the draft entries onto the end of the production array using
   `edit_file` to splice the new entries in just before the closing `]`
   (matching on the last entry's closing fields as the anchor) rather
   than reading and rewriting the whole file through `write_file` — this
   is the only workable approach for files too large to fit in context
   either direction, and it's cheaper even when `.bak` was possible.
4. Rename the draft file, in place inside
   `draft/new-entries/{batch}/`, to `{kind}-{level}-new.json.merged`
   (Filesystem `move_file`) so a re-run is a no-op instead of
   double-merging, same as the script. No cross-batch collision risk here
   since each batch has its own directory.

Production files are written directly in this stage (unlike Stage 5,
which only reads them) — the `.bak` step above is what makes that safe.

**Checkpoint 4 (final):** spot-check a few merged entries in the running
app, per the existing Step 5.3 convention — this part is still yours,
since Claude can't start or query the dev server.

```bash
node scripts/merge-to-production.mjs {level}
```

Kept above for reference/parity checking only — not run as part of this
pipeline, and note it reads from the fixed `draft/{level}/` path, not the
batch directory, so it's not a drop-in substitute for what Claude does
above without first copying the batch's files there yourself.

## New scripts to write

| Script                   | Input                               | Output          | Notes                                                                                       |
| ------------------------ | ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `dedupe-new-entries.mjs` | extracted-*.json + production files | `dup-report.md` | Read-only; wraps `find_dupes.py` normalization + extends cross-type check + adds fuzzy pass |

Stages 1, 3, 4, 5, and 6 have no script — Claude does them directly in
chat (no API cost, no exec access needed on the user's machine). Only
Stage 2's `dedupe-new-entries.mjs` is an actual script you run yourself.
`check-vocab.ts`, `check-uttrykk.ts`, `assign-ids.mjs`,
`find-diacritic-issues-all.mjs`, `find_dupes.py`, and
`merge-to-production.mjs` remain the reference implementations Claude's
in-chat work is checked against, but none of them are invoked as part of
this pipeline.

## Open questions before implementation

- Fuzzy-match threshold/library for the "similar entries" pass (simple
  Levenshtein on `lemma`, or something looser)?
- Should low-confidence level guesses from Stage 1 block automatically
  (exit nonzero, forcing review) or just get flagged in the checkpoint
  file?
- Batch naming convention for `draft/new-entries/{batch}/` — date-stamped
  (`2026-08-30/`) or user-named per session?

## Status

Implemented and in use (batches 01–04 as of 2026-08-30). Only Stage 2's
`dedupe-new-entries.mjs` is an actual script you run yourself; every
other stage, including the final merge, is done in-chat by Claude per
the notes above.
