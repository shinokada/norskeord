# Reclassification scripts (round 2)

Fixes the failure mode from the prior sessions: work "done" in chat that
was never actually written to disk, discovered only when a later session
tried to resume from a fictional log.

**Core idea: state lives in the repo files, never in a chat log.** Every
script re-derives what's actually true from `src/lib/data/*.json` on
each run. Nothing here trusts a "✅ Done" note.

## Workflow

1. **Classify** (still conversational/manual — judgment calls on
   borderline entries stay in chat with Claude).
2. As each decision is confirmed, append one line to
   `decisions/<level>.jsonl` — immediately, not at the end of a batch.
3. Run the apply scripts locally, always dry-run first:

```sh
node scripts/reclass/status.mjs --level a2
node scripts/reclass/apply-deletions.mjs --level a2          # dry run
node scripts/reclass/apply-deletions.mjs --level a2 --write
node scripts/reclass/apply-additions.mjs --level a2           # dry run
node scripts/reclass/apply-additions.mjs --level a2 --write
node scripts/reclass/migration-map-sweep.mjs                  # report only
node scripts/reclass/migration-map-sweep.mjs --write           # after adding remap decisions
```

If a session dies mid-batch, the next session just runs `status.mjs` —
no re-deriving "what did I already do" from chat history.

## Decision schema (`decisions/<level>.jsonl`, one JSON object per line)

```jsonc
// delete-only (redundant_grammar / dedupe, no vocab addition)
{"level":"a2","batch":1,"type":"delete","bucket":"redundant_grammar","source":{"norsk":"..."},"reason":"..."}

// move (delete from uttrykk + add to vocab)
{"level":"a2","batch":1,"type":"move","bucket":"move_to_vocab",
 "source":{"norsk":"..."},
 "vocab":{"norsk":"...","lemma":"...","part":"verb|adjective|noun|..."},
 "reason":"..."}

// add_vocab-only (vocab addition with no corresponding uttrykk deletion)
{"level":"a2","batch":1,"type":"add_vocab","bucket":"redundant_grammar",
 "vocab":{"norsk":"...","lemma":"..."},"reason":"..."}

// fix (in-place field correction; entry stays in uttrykk, nothing added
// or deleted). The apply scripts ignore this type by design — apply it
// as a direct edit. status.mjs verifies it by id against fix.norsk.
{"level":"b1","batch":1,"type":"fix","bucket":"data_quality",
 "source":{"norsk":"...","id":"w-XXXXXX"},
 "fix":{"norsk":"...","lemma":"...","english":"..."},"reason":"..."}
```

### Resolving a conflict

When `apply-additions.mjs` reports the vocab word already exists in
another level's file, and the decision is to accept that rather than add
a duplicate, add `"resolution":"skip"` (plus a `"resolution_reason"`) to
the original decision line. `status.mjs` then counts it as `applied`
instead of re-reporting it as a `conflict` on every future run. Do not
delete or rewrite the decision — the line is the audit trail for why the
uttrykk side was deleted but the vocab side wasn't added.

`source`/`vocab` can also carry an explicit `"id"` for exact matching —
recommended whenever the decision is a **merge/dedupe** between two
near-identical entries (see the known limitation below).

## Known limitation: text-matching and merge/dedupe

Matching is by normalized `norsk`/`lemma` text when no `id` is given.
This is ambiguous for a merge decision (delete one of two entries that
are textually identical or near-identical, e.g. `Vær så god.` vs
`vær så god`) — once one twin is deleted, the script can't tell the
remaining one apart from the deleted one by text alone. For any merge
decision, capture the source entry's `id` at decision time (before
deleting it) so it can be verified precisely later.

## `migration-map-sweep.mjs` and `decisions/migration-remaps.jsonl`

Separate decisions file, keyed by the legacy `id-migration-map.json` key
(not by level):

```jsonc
{"key":"u-a2-224","action":"remap","to":"w-007952","reason":"..."}
{"key":"u-a1-084","action":"delete","reason":"..."}
```

The sweep only touches keys it has a decision for; anything else is
reported as `NEEDS DECISION` and left alone.

## Seeded data

`decisions/a2.jsonl` already contains the reconstructed batch 1+2
history (31 uttrykk deletions / 11 vocab additions) from the prior
session's transcript, as a real test case — confirmed via
`status.mjs` to be 30/31 applied on disk, with the one exception being
the known merge-ambiguity case above (already correctly resolved on
disk, just not machine-verifiable after the fact).
