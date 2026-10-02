<script lang="ts">
  import type { CardProgress, GrammarQuestion, GrammarRule } from '$lib/types';
  import { countDueToday } from '$lib/progress';
  import { defaultTab, pickProgress, type TopicTab } from '$lib/grammar/topic-page';
  import * as m from '$lib/paraglide/messages';
  import ExplanationText from './ExplanationText.svelte';
  import GrammarSession from './GrammarSession.svelte';

  /**
   * Regel / Øv layout for one topic (grammar-update.md, Phase 6a).
   *
   * The session is mounted right away and only hidden on the Regel tab: it
   * loads the learner's progress, which is how we know whether cards are due
   * (returning learners with due cards open on Øv, new visitors on Regel), and
   * switching tabs never throws away a session in progress. The page keys this
   * component on the topic, so state resets when the learner moves to another one.
   */
  let {
    rule,
    questions,
    userId,
    tabParam = null
  }: {
    rule: GrammarRule | undefined;
    /** The questions this learner can practise (already gated and level-scoped). */
    questions: GrammarQuestion[];
    userId: string | null;
    /** Explicit `?tab=` from the URL; wins over the default. */
    tabParam?: TopicTab | null;
  } = $props();

  let dueCount = $state(0);
  let progressLoaded = $state(false);
  let chosenTab = $state<TopicTab | null>(null);

  // Until progress is known (and unless a tab was asked for) the Regel panel
  // shows: it is what the server renders for crawlers, and a returning learner
  // with due cards is switched to Øv as soon as their progress has loaded.
  let activeTab = $derived<TopicTab>(
    chosenTab ?? tabParam ?? (progressLoaded ? defaultTab(dueCount) : 'rule')
  );

  function handleProgress(map: Record<string, CardProgress>) {
    dueCount = countDueToday(
      pickProgress(
        questions.map((q) => q.id),
        map
      )
    );
    progressLoaded = true;
  }

  const tabClass = (active: boolean) =>
    `rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold focus:ring-4 focus:ring-indigo-300 focus:outline-none ${
      active
        ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
        : 'border-transparent text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-300'
    }`;
</script>

<div
  role="tablist"
  class="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700"
  data-testid="topic-tabs"
>
  <button
    type="button"
    role="tab"
    id="topic-tab-rule"
    aria-selected={activeTab === 'rule'}
    aria-controls="topic-panel-rule"
    data-testid="topic-tab-rule"
    class={tabClass(activeTab === 'rule')}
    onclick={() => (chosenTab = 'rule')}
  >
    {m.grammar_topic_tab_rule()}
  </button>
  <button
    type="button"
    role="tab"
    id="topic-tab-practice"
    aria-selected={activeTab === 'practice'}
    aria-controls="topic-panel-practice"
    data-testid="topic-tab-practice"
    class={tabClass(activeTab === 'practice')}
    onclick={() => (chosenTab = 'practice')}
  >
    {m.grammar_topic_tab_practise()}
    {#if dueCount > 0}
      <span
        class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        data-testid="topic-due-badge"
      >
        {m.stats_due_count({ count: dueCount })}
      </span>
    {/if}
  </button>
</div>

<div
  role="tabpanel"
  id="topic-panel-rule"
  aria-labelledby="topic-tab-rule"
  data-testid="topic-rule"
  hidden={activeTab !== 'rule'}
>
  {#if rule}
    <div
      class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-indigo-950/60"
    >
      <ExplanationText text={rule.explanationNb} collapsible={false} />
    </div>
  {/if}
  <button
    type="button"
    data-testid="topic-start-practice"
    onclick={() => (chosenTab = 'practice')}
    class="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
  >
    {m.grammar_topic_start_practice()}
  </button>
</div>

<div
  role="tabpanel"
  id="topic-panel-practice"
  aria-labelledby="topic-tab-practice"
  data-testid="topic-practice"
  hidden={activeTab !== 'practice'}
>
  <GrammarSession {questions} {rule} {userId} onprogressloaded={handleProgress} />
</div>
