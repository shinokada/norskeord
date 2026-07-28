---
name: gating-rules
description: Free vs Plus gating policy across the app — grammar, vocab, quiz. Living reference, not an implementation plan.
---

# Gating rules

This is a reference doc for what's free vs Plus-gated, and why — not a phased build plan (see
`ai-docs/implementation/` for those). Update it whenever a gating decision changes so the rule
lives in one place instead of being re-derived from `config.ts` each time.

## Grammar

**Decision: gate by topic, not by question count.** A topic is either fully open (every question
playable) or fully Plus-gated (locked at the picker) — no partial-preview cap inside a free topic.

This replaces the previous two-gate system (`FREE_GRAMMAR_TOPICS` for discoverability +
`FREE_GRAMMAR_PER_TOPIC = 3` as a global depth cap applied inside every free topic regardless of
size). That system was undermining its own stated intent in places — e.g. `adj-agreement` has 24
B1-era questions with zero `plusOnly` flags (i.e. the content itself was authored as fully free),
yet the global cap still only let a free user play 3 of them. It also doesn't match how vocab is
gated (`PLUS_CATEGORIES` is a whole-category switch, no per-word cap inside a free category) —
grammar having a second, different gating axis was inconsistent and confusing to reason about (see
the bug report that prompted this: `/grammar/ikke-placement`, `/grammar/det-er-ikke`, and
`/grammar/modal-verb-order` all showing "3 questions" for free users despite having 8–20 total).

**Per-level free topic selection — current policy: A1 all + 2 teaser topics each at A2/B1.**

Free grammar access is A1 for every topic, plus two hand-picked teaser topics each at A2 and B1,
plus nothing at B2/C. This supersedes the earlier strict A1-only policy (kept below for history).

The A2/B1 teaser topics were chosen from real `grammar.json` counts under two constraints: (1)
zero `plusOnly` questions at that level — marking a level "free" in `FREE_GRAMMAR_TOPICS` does
**not** override an individual question's `plusOnly` flag, so a level with all-plusOnly questions
would open to zero actual playable content; and (2) no overlap with a level the topic is already
free at, so each pick is a genuinely new free topic rather than an extension of an existing one.
Two topics per level (not three) was a deliberate choice — at 27–38 free questions per level it's
already 2–4 full 10-question sessions before a free user hits a lock, without so much free A2/B1
content that Plus stops feeling worth it.

| Level | Total topics available | Free topics                                       | Free questions | Notes                                                                                                                                                                                                                                  |
| ----- | ---------------------- | ------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1    | 30                     | All 30                                            | 254 / 254      | Unchanged — A1 is the onboarding tier; gating a beginner's very first grammar content undercuts onboarding more than it protects revenue. No plusOnly flags exist at A1, so every A1 question across these 30 topics is playable free. |
| A2    | 27                     | 2: `ikke-placement`, `adj-comparison`             | 27 / 256       | Negation placement (13 Q) + comparative/superlative adjectives (14 Q). Both zero-plusOnly at A2 and neither has A1 content, so this is 27 genuinely new free questions.                                                                |
| B1    | 41                     | 2: `ordfamilie-avledning`, `bade-og-verken-eller` | 38 / 427       | Word-family derivation (26 Q, the single largest B1 topic) + både...og/verken...eller correlative conjunctions (12 Q). Both zero-plusOnly at B1, neither has A1/A2 content.                                                            |
| B2    | 2                      | 0                                                 | 0 / 7          | Only 2 topics exist at B2 at all, and both are almost entirely `plusOnly` at the question level (1 free-if-opened question total across both) — no meaningful teaser tier to build, so B2 has no `FREE_GRAMMAR_TOPICS` entries.        |
| C     | 24                     | 0                                                 | 0 / 425        | Every single C question across all 24 topics is individually `plusOnly` — opening any C topic in the policy map would unlock zero questions. C is fully Plus, full stop.                                                               |

Side effect worth knowing: of the 3 former A1-only-era teaser topics (`ikke-placement`,
`v2-word-order`, `det-er-ikke`, all zero-A1-content), `ikke-placement` is back in the map — now
free at A2 instead of A1, since it has no A1 content — while `v2-word-order` and `det-er-ikke`
remain absent (fully Plus-gated at every level), since only two A2 slots were available this round
and `adj-comparison` (higher question volume) was picked over them.

<details>
<summary>Superseded: strict A1-only policy (kept for history)</summary>

As of a prior revision, free grammar access was scoped to A1 only, including for topics that also
have A2/B1/B2/C content — every non-A1 level was fully Plus-gated, full stop, with no teaser tier
at A2/B1 at all. This was superseded by the two-teaser-topics-per-level policy above.

</details>

<details>
<summary>Superseded proposal (kept for history, never implemented)</summary>

Before the A1-only policy, an earlier proposal picked 3 free teaser topics for A2/B1/C
individually (ikke-placement / v2-word-order / det-er-ikke at A2; framtid-uttrykk / og-men /
presens-perfektum at B1; ordfamilie-avledning / koordinerende-konjunksjoner /
perfektum-pluskvamperfektum at C; all of B2 since it only has 2 topics). This was superseded by
the simpler A1-only rule before the B1/C picks were ever implemented in config.ts — only the A2
picks (as pre-existing teasers) were ever live, and those were narrowed away under A1-only before
being partially reinstated (ikke-placement only) under the current policy.

</details>

**Resolved — gate by topic × CEFR level, not by topic alone.** A topic stays the single browsing
unit (one card in the `/grammar` picker, one URL, one shared rule explanation via
`GRAMMAR_RULES`) — we deliberately did **not** split multi-level topics into separate
per-level topics (e.g. `modal-verb-order-a1` / `-a2` / `-b1`). That would have meant: rewriting
or duplicating explanation prose across up to 3 keys per topic, migrating `grammar_progress` rows
(which store `topic` as free text tied to real user history) to new topic names, and roughly
doubling the topic count in the picker (32 of the 82 grammar topics span more than one CEFR level
— this is the common case, not an edge case). None of that was necessary for what we actually
needed, which was just: let free-vs-Plus differ _within_ a topic by level.

Instead, `FREE_GRAMMAR_TOPICS` (`config.ts`) is keyed by topic and maps each one to either
`'all'` (free at every level it has questions at) or an explicit list of the specific CEFR levels
that are free, e.g. `'modal-verb-order': ['A1']` makes it free at A1 but Plus-gated at A2/B1.
Under the current policy (see the table above), most entries are `['A1']`; four entries
(`ikke-placement`, `adj-comparison`, `ordfamilie-avledning`, `bade-og-verken-eller`) are a single
non-A1 level instead, since those four have no A1 content of their own. No topic currently uses
`'all'`, though the mechanism still supports it if a future decision reintroduces free access
above a topic's teaser level.

`isFreeGrammarTopic(topic, cefr?)` in `access.ts` now takes an optional `cefr`: called with just
`topic` (as the `/grammar` picker does, since it groups by topic only) it means "free at _some_
level"; called with `cefr` too (as the topic detail page does, per question) it checks that exact
level. `freeGrammarQuestionIds()` uses the per-question `cefr` field that already existed on every
`GrammarQuestion` — no data migration needed there either.

**Implementation note (done):** `FREE_GRAMMAR_PER_TOPIC` (the old 3-questions-per-topic cap) has
been removed. `freeGrammarQuestionIds()` no longer caps by count — a free topic-level pair is now
fully open (every non-`plusOnly` question), matching the "gate by topic, not by question count"
decision above. This means e.g. `noun-plurals` (free at A1 only) exposes its 8 free A1 questions
to free users, capped only by `SESSION_SIZE` (10) per sitting if the free pool exceeds it — its
A2/B1 questions (including several flagged `plusOnly`) stay Plus-gated. The `/grammar/[topic]`
lock screen remains binary (locked only when `playable.length === 0`, i.e. every question at
every level the free user can see is `plusOnly`, further scoped to an optional `?level=` param —
see below); that didn't need to change beyond that scoping.

**Picker level-filter bug (fixed) — now via segment cards, not a reactive recompute:** the
`/grammar` picker used to compute its free/locked split once at load time via
`isFreeGrammarTopic(topic)` with no `cefr` ("free at _some_ level"), then reused that same split
regardless of which CEFR filter pill was active — so a topic free only at A1 (e.g.
`modal-verb-order`) would still render as a free card when filtered to B1. This was first patched
with a reactive `isFreeForCurrentFilter()` recompute, then replaced entirely by
`groupTopicLevelsByAccess()` (`access.ts`) — see `ai-docs/implementation/grammar-fix.md`. The
picker now renders one card per contiguous access _segment_ rather than one card per topic: a
mixed-access topic like `noun-plurals` produces two cards (`{free, [A1]}` and
`{locked, [A2, B1]}`), each with a fixed access state that filtering only shows/hides, never
flips. `+page.ts` returns `data.segments`; `+page.svelte` filters/groups those directly with no
run-time free/locked recomputation needed.

**Level-scoped topic detail page (done):** `/grammar/[topic]` now reads an optional `?level=`
search param (`+page.svelte`). When present, a user's playable set is further filtered to that
level, so a locked-segment link or a level-hub link (`/learn/[level]`) that points at a level the
topic _isn't_ free at correctly shows the paywall for a free user — instead of the page silently
falling back to whichever level _is_ free (e.g. showing A1 content when a user followed a B1
link). Originally this scoping only applied to free/guest users, with Plus users always seeing
every level combined regardless of the param; `ai-docs/implementation/grammar-ux-update.md` Step 1
extended it to Plus users too, since a Plus account clicking a topic from e.g. `/learn/b2` was
still shown that topic's A2/B1 questions alongside its B2 ones — the param now narrows what's
shown for every user, not just free ones. The `/learn/[level]` hub's own `free` flag was also
fixed to use `isFreeGrammarTopic(topic, level)` instead of the any-level check, and its topic
links now pass `&level=<LEVEL>` alongside the existing `?from=<level>` back-nav param.
