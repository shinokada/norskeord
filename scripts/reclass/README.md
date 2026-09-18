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

### `redundant_grammar` bucket — policy (updated 2026-09-16)

`redundant_grammar` entries are fully productive collocations where every
component word already has its own vocab entry (e.g. `bli`/`være` + a
predicative adjective, or a basic verb+object pair like `sette grenser`).

**These now stay in `uttrykk-<level>.json` — do not delete them.** The
bucket is still worth tagging during classification (useful metadata for
a future dedupe/quality pass), but no `delete` decision should be logged
for it. The card has real value even when compositional: it lets a
learner practice a combination of words they already know, with a real
example sentence.

This reverses the original round-2 policy, under which `redundant_grammar`
meant delete. Roughly 30 entries across A1, A2, and B1 batch 1 were
already deleted under the old policy before the reversal — see the
"Retroactive undo" section of
`ai-docs/implementation/vocab-uttrykk-reclassification-workflow-2.md` for
the restoration plan and status. Do not treat those old deletions as
precedent for new decisions.

### Resolving a conflict (policy updated 2026-09-17)

When `apply-additions.mjs` reports the target vocab lemma already exists
elsewhere, first check whether the existing entry is the **same sense**
as the uttrykk source, or a **different sense/collocation** that just
happens to share a lemma:

- **Same sense, genuine duplicate** (near-identical meaning and example
  already captured) — this is the only case where `"resolution":"skip"`
  applies: delete the uttrykk source, don't add a duplicate vocab entry,
  and log `"resolution":"skip"` + `"resolution_reason"` on the decision
  line as before.
- **Different sense/collocation** (e.g. `koke over` as "to boil over /
  lose one's temper" vs. an unrelated existing `koke`; `sperre øynene
  opp` vs. existing `sperre` "to block") — **do not skip.** Add the
  phrase as its own distinct vocab entry (its own `norsk`/`lemma`, full
  translations and example) even though a same-text or same-root lemma
  exists elsewhere. Deleting the uttrykk source with nothing added loses
  a real, usable collocation example — exactly the content this app is
  built to show ("not a dictionary, show as many examples as possible").
  Only delete the uttrykk source once the replacement vocab entry has
  actually been written and verified on disk.

Before 2026-09-17, `skip` was used for both cases — any target lemma
that existed anywhere, same sense or not, caused the uttrykk source to
be deleted with nothing added. That produced real content loss (see the
B1 "skip" audit in the workflow doc's retroactive-undo section); do not
treat old `skip` decisions as precedent without checking which bucket
they actually belong to.

Do not delete or rewrite a decision line after resolving it — the line
is the audit trail for why the uttrykk side was deleted (and, for a
same-sense skip, why the vocab side wasn't added).

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
