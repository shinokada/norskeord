# Grammar UX Update: Scope questions to the level the user came from

## Problem

Grammar topics span multiple CEFR levels (e.g. "Relativsetninger med som" has
A2, B1, and B2 questions in `grammar.json`). When a user lands on a topic
page, they should only practice the level they came from:

- `/learn/b2` → click a Grammar card → should show **B2 questions only**
- `/learn/a2` → click a Grammar card → should show **A2 questions only**
- `/grammar` with level pill "A2" selected → click a topic card → should
  show **A2 questions only**

Currently all three cases can show questions from every level the topic has,
not just the one the user selected.

## Root cause

No data model change is needed. `grammar.json` already has a `cefr` field per
question, and `/grammar/[topic]/+page.ts` already loads every question for a
topic. The bug is in the two places that turn "which level was the user
browsing" into actual filtering — one is disconnected, the other is scoped
to the wrong condition.

**1. `src/routes/grammar/[topic]/+page.svelte` — level filter only applies to free users**

```ts
let playable = $derived(
  isPlus
    ? data.questions // ← ignores levelParam() entirely
    : data.questions.filter((q) => freeSet.has(q.id) && (!levelParam() || q.cefr === levelParam()))
);
```

`levelParam()` (read from `?level=`) is already parsed and already correct —
it's just never consulted when `isPlus` is true. This explains the
`/learn/b2` and `/learn/a2` cases: `/learn/[level]/+page.svelte` already
links with `?from=${level}&level=${LEVEL}`, so the param arrives correctly;
it's just discarded for Plus accounts (and for any free account viewing a
topic where every question happens to be free).

**2. `src/lib/components/grammar/TopicCard.svelte` — no query params at all**

```svelte
<a href={`/grammar/${topic}`} ...>
```

This is the only place `/grammar/+page.svelte` links to a topic. It doesn't
forward the active level-pill filter (`selectedLevel`) or any `from`, so
even if fix #1 lands, the `/grammar` hub case still can't scope by level —
there's no param to scope by.

## Plan

### Step 1 — Fix `/grammar/[topic]/+page.svelte` filtering ✅ Done

Unify the two conditions so level scoping applies regardless of plan tier:

```ts
let playable = $derived(
  (isPlus ? data.questions : data.questions.filter((q) => freeSet.has(q.id))).filter(
    (q) => !levelParam() || q.cefr === levelParam()
  )
);
```

Behavior after the fix:

- `?level=B2` present → only B2 questions play, for everyone.
- No `?level=` param (e.g. bookmarked `/grammar/relativsetninger-som` with no
  query string) → unchanged, shows every level the topic has, same as today.

No change needed to `levelParam()` parsing itself — it's already correct.

### Step 2 — Pass the level through from `TopicCard.svelte` ✅ Done

Add optional `level` and `from` props so the link can carry the same query
params `/learn/[level]` already uses:

```ts
let {
  topic,
  rule,
  total,
  levels,
  level = null,
  from = null
}: {
  topic: GrammarTopic;
  rule: GrammarRule | undefined;
  total: number;
  levels: CEFRLevel[];
  level?: CEFRLevel | null;
  from?: string | null;
} = $props();

let href = $derived(
  level ? `/grammar/${topic}?level=${level}${from ? `&from=${from}` : ''}` : `/grammar/${topic}`
);
```

### Step 3 — Wire `selectedLevel` through in `/grammar/+page.svelte` ✅ Done

Pass the active pill filter into every `<TopicCard>` call (both the free and
locked-but-Plus branches):

```svelte
<TopicCard
  topic={seg.topic}
  rule={GRAMMAR_RULES[seg.topic]}
  total={seg.total}
  levels={seg.levels}
  level={selectedLevel}
/>
```

When no pill is selected, `selectedLevel` is `null`, so `href` falls back to
the current unscoped link — behavior for the "browse everything" case is
unchanged.

Note: a segment can span more than one level (e.g. free at A1+A2). If the
user hasn't picked a pill, the topic page still shows the combined set,
same as today — only an explicit pill selection scopes it down.

### Step 4 — Level hub cards should show only their own level's badge ✅ Done

On `/learn/[level]`, each Grammar card currently shows a badge per level the
_topic_ spans (e.g. A2 · B1 · B2 all on one card, even on the B2 hub), and
its "N questions" count includes every level's questions too. Root cause is
in `src/routes/learn/[level]/+page.server.ts`:

```ts
// Group ALL questions by topic (not filtered by level) so the count matches
// what the user will actually practice on /grammar/[topic]
const allTopicMap = new Map<GrammarTopic, GrammarQuestion[]>();
for (const q of questions) {
  if (topicsAtLevel.has(q.topic)) {
    if (!allTopicMap.has(q.topic)) allTopicMap.set(q.topic, []);
    allTopicMap.get(q.topic)!.push(q);
  }
}

const grammarTopics = Array.from(allTopicMap.entries()).map(([topic, qs]) => ({
  topic,
  total: qs.length,
  levels: topicLevels(qs) as CEFRLevel[],
  free: isFreeGrammarTopic(topic, levelUpper)
}));
```

That "match what the user will practice" comment was true before Step 1 —
the topic page used to show every level regardless, so the hub's combined
count/badges were arguably accurate. After Step 1, practice is scoped to
the hub's own level, so the card should be too. Fix: filter `qs` down to
this level's questions only, for both `total` and `levels`:

```ts
const allTopicMap = new Map<GrammarTopic, GrammarQuestion[]>();
for (const q of questions) {
  if (q.cefr === levelUpper) {
    if (!allTopicMap.has(q.topic)) allTopicMap.set(q.topic, []);
    allTopicMap.get(q.topic)!.push(q);
  }
}
```

(`topicsAtLevel` becomes redundant for this loop — filtering on `q.cefr ===
levelUpper` directly is the same set of topics, now with only the matching
questions attached.) `levels` will then always resolve to a single-entry
array (e.g. `['B2']`) on every level hub, and `total` will match the count
of questions actually playable via the Step 1/2/3 scoped link. The existing
badge-rendering markup in `+page.svelte` needs no change — it already loops
over `t.levels`, which will now just have one item.

### Step 5 — Small UX addition: show the active scope + an escape hatch ✅ Done

On `/grammar/[topic]/+page.svelte`, when `levelParam()` is set, show a small
indicator near the title (e.g. a `{levelParam()}` badge) plus a text link to
drop the param and see every level:

```svelte
{#if levelParam()}
  <p class="text-sm text-gray-500">
    Showing {levelParam()} only ·
    <a href="/grammar/{data.topic}" class="underline">see all levels</a>
  </p>
{/if}
```

This isn't required to fix the reported bug, but without it a user has no
way back to the "all levels" view once scoped, other than editing the URL.

## Files touched

- `src/routes/grammar/[topic]/+page.svelte` (Step 1, Step 5)
- `src/lib/components/grammar/TopicCard.svelte` (Step 2)
- `src/routes/grammar/+page.svelte` (Step 3)
- `src/routes/learn/[level]/+page.server.ts` (Step 4)
- `src/routes/learn/[level]/+page.svelte` — **no change**, it already links
  with `?from=${level}&level=${LEVEL}` correctly and already loops over
  `t.levels` for badges; Step 4 just changes what `t.levels`/`t.total`
  contain, and Step 1 makes the link's `?level=` actually get honored.

## Explicitly not needed

- No new fields on `GrammarQuestion` or `grammar.json` — `cefr` per question
  already exists and is sufficient.
- No route/URL structure change — `?level=` and `?from=` already exist as a
  convention from the earlier Plus-gating work
  (`ai-docs/implementation/grammar-fix.md` §5); this reuses it rather than
  inventing a second mechanism.

## Testing checklist

- [✅] `/learn/b2` → mixed-level topic's card shows only a `B2` badge and its own-level question count
- [✅] `/learn/b2` → click a mixed-level topic → only B2 questions appear (Plus account)
- [✅] `/learn/a2` → click the same topic → only A2 questions appear
- [✅] `/grammar` with no pill selected → topic shows all levels (unchanged)
- [✅] `/grammar` with "A2" pill selected → click topic → only A2 questions appear
- [✅] Free account, topic free only at A1, `/learn/b1` link to it → still paywalled (existing §5 behavior preserved)
- [✅] Direct nav to `/grammar/some-topic` with no query string → all levels, unchanged
- [✅] "see all levels" link clears scoping correctly
