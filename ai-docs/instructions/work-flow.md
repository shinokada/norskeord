# Vocabulary Image Conversion — Method 2 Workflow

This is the operational guide for turning a photo of a vocabulary page into finished `vocab-{level}-new.json` / `uttrykk-{level}-new.json` drafts using the two-step pipeline defined in `ai-docs/instructions/image-converter.md`.

Method 2 splits image conversion into a cheap, verifiable extraction pass (Step 1) and a separate enrichment pass (Step 2), instead of doing everything in one AI turn (Method 1, `image-converter-old.md`). Use Method 2 going forward for anything beyond a one-off single image — it's easier to check for mistakes and easier to batch.

---

## Step 1 — Extract (you + Claude in chat)

1. Upload the image(s) to a chat with Claude, referencing `ai-docs/instructions/image-converter.md` and asking for **Step 1 only**.
2. Claude returns two small JSON arrays — words and expressions — containing just `id`, `norsk`, `lemma`, `definition`, `level`, `part` (and `category: "uttrykk"` for expressions).
3. Save them to a draft location, e.g.:
   - `draft/{level}/extracted-vocab-{level}.json`
   - `draft/{level}/extracted-uttrykk-{level}.json`

**With multiple images:** each new image's entries must be **appended** to these files, never overwrite them. If you're doing Step 1 for image #2 in the same chat as image #1, ask Claude to add the new entries to the existing arrays rather than replacing the file. If you're starting a new chat, paste in the current contents of `extracted-vocab-{level}.json`/`extracted-uttrykk-{level}.json` first so Claude can append to them instead of starting fresh.

**Why do this in chat rather than a script:** reading a photo of a book page still benefits from your eyes catching OCR mistakes in real time, and the output is small enough to review quickly.

## Step 1.5 — Review (you, ~1 minute per image)

Because Step 1 only extracts `norsk`, `definition`, and `part`, this is fast to eyeball against the photo directly:

- Does `norsk` match what's printed, with the gender/verb conversions applied correctly (Rules 2 and 4 in the instructions doc)?
- Is the word/expression split correct (Rule 3) — especially for entries where the headword itself is a multi-word phrase?
- Is `lemma` right, especially for verb-led vs. subject-led expressions (Rule 4's `å`-prefix logic)?

Fix anything wrong directly in the JSON before moving on — it's much cheaper to fix 3 fields now than to fix all 15 fields after Step 2 has built on top of a bad extraction.

## Step 2 — Enrich (scripted, via Claude API)

Once extraction is reviewed and correct, run it through an enrichment script (not chat) so it can be batched and rerun without re-uploading images.

Suggested script: `scripts/enrich-vocab.mjs --level {level}`, following the same conventions as your existing scripts (`classify-vocab-phrases.mjs`, `fill-uttrykk-examples.mjs`):

- Load `ANTHROPIC_API_KEY` from `.env`.
- Read the reviewed Step 1 JSON.
- For **category balancing** (Rule 9 in the instructions doc), first compute the current category distribution from `src/lib/data/vocab-{level}.json` and pass it into the prompt, so the model favors under-represented categories instead of repeating the same few.
- Send the Step 1 entries (batched, e.g. 10 at a time, same batch-size pattern as `classify-vocab-phrases.mjs`) to the API with the Step 2 instructions from `image-converter.md` as the system prompt.
- Write completed entries to:
  - `draft/{level}/vocab-{level}-new.json`
  - `draft/{level}/uttrykk-{level}-new.json`

**Append, don't overwrite:** if these draft files already contain entries from a previous batch of images, the script must read the existing file first and append the newly enriched entries to it, rather than replacing the file. This matters as soon as you're processing images across more than one run of the script.

This step doesn't need chat or image upload at all — it's pure JSON-in, JSON-out, which is why it's a good candidate for a script instead of manual conversation.

## Step 3A - Find duplicates
The following will find duplicates for vocab and uttrykk.

```bash
  python scripts/find_dupes.py
```

## Step 3B — Validate (scripted)

Run your existing validation scripts against the drafts:

- `check-vocab.mjs`
- `check-uttrykk.mjs`

Fix anything flagged before merging.

## Step 4 — Assign IDs (scripted, after validation)

Neither Step 1 nor Step 2 assigns real `id` values — they're left as `""` throughout, because the ID format (`v-{level}-{category}-{NNN}` per `data-rules/vocab-and-uttrykk.md`) depends on `category`, which isn't known until Step 2 finishes, and on the next free `NNN` per category, which depends on what's already in production.

A small script should:
Use scripts/assign-ids.mjs

1. Read the current max `NNN` per category from `src/lib/data/vocab-{level}.json` / `uttrykk-{level}.json`.
2. Assign the next sequential ID to each new entry in the draft file.

## Step 5 — Merge into production

USE scripts/merge-to-production.mjs

1. Back up the current production file first (matches your existing `.bak` convention): copy `src/lib/data/vocab-{level}.json` → `vocab-{level}.json.bak` (and same for `uttrykk-{level}.json`).
2. Append or merge the validated, ID-assigned draft entries into the production file.
3. Spot-check a few entries in the running app before considering the batch done.

---

## Quick reference: who does what

| Step | Who / what             | Input                    | Output                                                            |
| ---- | ---------------------- | ------------------------ | ----------------------------------------------------------------- |
| 1    | Claude in chat         | Image(s)                 | `extracted-vocab-{level}.json` / `extracted-uttrykk-{level}.json` |
| 1.5  | You                    | Extracted JSON + photo   | Corrected extracted JSON                                          |
| 2    | Script (Claude API)    | Corrected extracted JSON | `vocab-{level}-new.json` / `uttrykk-{level}-new.json`             |
| 3    | Script (`check-*.mjs`) | New draft JSON           | Pass/fail report                                                  |
| 4    | Script                 | Validated draft JSON     | Draft JSON with real `id` values                                  |
| 5    | You                    | ID-assigned draft JSON   | Merged into `src/lib/data/*.json`                                 |

## Note on duplicates when appending

Appending across multiple images increases the chance the same `lemma` shows up twice (e.g. if a word appears on two different pages, or you accidentally process the same image twice). Neither Step 1 nor Step 2 checks for this. Before Step 3 validation, run `find_dupes.py` against the accumulated draft file, since duplicates weren't a concern when each image produced its own standalone file.

## Note on missing Spanish/Ukrainian in production

`vocab-c.json` and `uttrykk-c.json` currently only have `english`/`german` filled in — `spanish`/`ukrainian` are being backfilled separately. Method 2 still generates all four languages for every new entry (per `image-converter.md`), so new entries won't be behind once the backfill catches up to older ones.

## Command workflow

```bash
node scripts/enrich-vocab.mjs --level c --dry-run   # optional: confirm counts dropped to 216/224
node scripts/enrich-vocab.mjs --level c
node scripts/find-diacritic-issues-all.mjs c
python scripts/find_dupes.py
node scripts/check-vocab.mjs / check-uttrykk.mjs
node scripts/assign-ids.mjs c
node scripts/merge-to-production.mjs
```
