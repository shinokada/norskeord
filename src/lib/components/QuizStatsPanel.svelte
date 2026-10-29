<!--
  QuizStatsPanel.svelte
  quiz-progress.md Phase 3: the Quiz tab's content on /my-progress. Standalone: it gets
  the summary for the selected level and renders three figures (questions answered,
  accuracy, words quizzed) or an empty state. The "Start quiz" button lives in the panel
  header in +page.svelte, next to where the other tabs have "Study due now".

  Accuracy shows "–" until QUIZ_MIN_ANSWERS_FOR_ACCURACY answers, so 1 out of 1 does not
  read as 100%.
-->
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { quizAccuracy, QUIZ_MIN_ANSWERS_FOR_ACCURACY, type QuizSummary } from '$lib/quiz-stats';

  interface Props {
    /** Stats for the selected level. */
    summary: QuizSummary;
  }

  let { summary }: Props = $props();

  const accuracy = $derived(quizAccuracy(summary));
  const tiles = $derived([
    {
      id: 'answered',
      label: m.stats_quiz_answered_label(),
      value: String(summary.answered),
      color: 'text-gray-800 dark:text-white'
    },
    {
      id: 'accuracy',
      label: m.stats_quiz_accuracy_label(),
      value: accuracy === null ? '–' : `${accuracy}%`,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'words',
      label: m.stats_quiz_words_label(),
      value: String(summary.words),
      color: 'text-gray-800 dark:text-white'
    }
  ]);
</script>

{#if summary.answered === 0}
  <div
    data-testid="quiz-stats-empty"
    class="mb-8 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
  >
    <p class="text-2xl" aria-hidden="true">🧠</p>
    <p class="mt-2 font-medium text-gray-800 dark:text-white">{m.stats_quiz_empty_heading()}</p>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">{m.stats_quiz_empty_body()}</p>
  </div>
{:else}
  <div
    data-testid="quiz-stats"
    class="mb-3 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10"
  >
    {#each tiles as tile (tile.id)}
      <div class="bg-white p-4 text-center dark:bg-indigo-950/60">
        <p class="text-2xl font-bold {tile.color}" data-testid="quiz-stat-{tile.id}">
          {tile.value}
        </p>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{tile.label}</p>
      </div>
    {/each}
  </div>
  {#if accuracy === null}
    <p class="mb-8 text-xs text-gray-500 dark:text-gray-300">
      {m.stats_quiz_min_hint({ count: QUIZ_MIN_ANSWERS_FOR_ACCURACY })}
    </p>
  {:else}
    <div class="mb-8"></div>
  {/if}
{/if}
