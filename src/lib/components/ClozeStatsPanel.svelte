<!--
  ClozeStatsPanel.svelte
  cloze-quiz.md Phase 5: the Sentences section of the Quiz tab on /my-progress. Standalone:
  it gets the Sentences summary for the selected level and the per-category rows from
  clozeStatRowsForLevel(), and renders a heading with a "Practice sentences" link, three
  figures (or an empty state), and one bar per category, Vocabulary first, then Uttrykk.

  The bars do not come from FSRS state, so they do not go through LevelStatRows (whose
  legend says Memorized / Learning / Forgotten). Each bar has up to two coloured parts:
  "mastered in context" in the level colour and "practiced" in yellow; the rest is new.

  Accuracy shows "–" until QUIZ_MIN_ANSWERS_FOR_ACCURACY answers, the same rule as Words.
-->
<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { quizAccuracy, QUIZ_MIN_ANSWERS_FOR_ACCURACY, type QuizSummary } from '$lib/quiz-stats';
  import type { ClozeLevelRows, ClozeStatRow } from '$lib/cloze-stats';

  interface Props {
    /** Sentences stats for the selected level. */
    summary: QuizSummary;
    /** The per-category bars for the selected level. */
    rows: ClozeLevelRows;
    /** The level's "mastered" bar colour, e.g. 'bg-green-500'. */
    levelColor: string;
    /** Opens a Sentences quiz for the selected level. */
    practiceHref: string;
  }

  let { summary, rows, levelColor, practiceHref }: Props = $props();

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

  const groups = $derived([
    { id: 'vocab', title: m.stats_vocabulary_heading(), rows: rows.vocab },
    { id: 'uttrykk', title: m.stats_uttrykk_heading(), rows: rows.uttrykk }
  ] as const);

  function pct(part: number, total: number): number {
    return total > 0 ? (part / total) * 100 : 0;
  }

  // Bar parts as a share of the row's total: mastered, then practiced but not mastered.
  function masteredW(row: ClozeStatRow): number {
    return pct(row.mastered, row.total);
  }
  function practicedW(row: ClozeStatRow): number {
    return pct(row.practiced - row.mastered, row.total);
  }
</script>

<section data-testid="cloze-stats-section" aria-labelledby="cloze-stats-heading">
  <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
    <h3 id="cloze-stats-heading" class="!my-0 text-base font-semibold">
      <span aria-hidden="true">✍️</span>
      {m.stats_sentences_heading()}
    </h3>
    <a
      href={practiceHref}
      data-testid="cloze-practice-link"
      class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none"
    >
      {m.stats_sentences_practice()}
    </a>
  </div>

  {#if summary.answered === 0}
    <div
      data-testid="cloze-stats-empty"
      class="mb-4 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
    >
      <p class="font-medium text-gray-800 dark:text-white">{m.stats_sentences_empty_heading()}</p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
        {m.stats_sentences_empty_body()}
      </p>
    </div>
  {:else}
    <div
      data-testid="cloze-stats"
      class="mb-3 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10"
    >
      {#each tiles as tile (tile.id)}
        <div class="bg-white p-4 text-center dark:bg-indigo-950/60">
          <p class="text-2xl font-bold {tile.color}" data-testid="cloze-stat-{tile.id}">
            {tile.value}
          </p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{tile.label}</p>
        </div>
      {/each}
    </div>
    {#if accuracy === null}
      <p class="mb-4 text-xs text-gray-500 dark:text-gray-300">
        {m.stats_quiz_min_hint({ count: QUIZ_MIN_ANSWERS_FOR_ACCURACY })}
      </p>
    {/if}
  {/if}

  {#each groups as group (group.id)}
    {#if group.rows.length > 0}
      <h4
        class="mt-4 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
        data-testid="cloze-group-{group.id}"
      >
        {group.title}
      </h4>
      <div class="mb-2 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
        <div
          class="divide-y divide-gray-100 bg-white dark:divide-gray-700/60 dark:bg-indigo-950/60"
        >
          {#each group.rows as row (row.key)}
            <a
              href={row.href}
              data-testid="cloze-row-{group.id}-{row.key}"
              class="group flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-gray-50 sm:gap-3 dark:hover:bg-gray-800/50"
            >
              <span
                class="w-28 shrink-0 truncate text-xs font-medium text-gray-700 group-hover:text-blue-600 sm:w-44 dark:text-gray-300 dark:group-hover:text-blue-400"
                title={row.label}
              >
                {row.label}
              </span>
              <div class="min-w-0 flex-1">
                <div
                  class="h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40"
                  role="img"
                  aria-label={m.stats_sentences_count({ count: row.practiced, total: row.total })}
                >
                  <div class="flex h-full">
                    {#if row.mastered > 0}
                      <div
                        data-testid="cloze-bar-mastered"
                        class="h-full transition-all {levelColor}"
                        style="width: {masteredW(row)}%"
                      ></div>
                    {/if}
                    {#if row.practiced - row.mastered > 0}
                      <div
                        data-testid="cloze-bar-practiced"
                        class="h-full bg-yellow-400 transition-all"
                        style="width: {practicedW(row)}%"
                      ></div>
                    {/if}
                  </div>
                </div>
              </div>
              <span
                data-testid="cloze-row-count"
                class="w-24 shrink-0 text-right text-xs text-gray-700 tabular-nums sm:w-36 dark:text-gray-300"
              >
                {m.stats_sentences_count({ count: row.practiced, total: row.total })}
              </span>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {/each}

  {#if rows.vocab.length > 0 || rows.uttrykk.length > 0}
    <div
      class="mb-6 flex flex-wrap gap-4 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-700 dark:bg-indigo-900/40 dark:text-gray-300"
    >
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-3 rounded-sm {levelColor}"></span>
        {m.stats_sentences_legend_mastered()}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-3 rounded-sm bg-yellow-400"></span>
        {m.stats_sentences_legend_practiced()}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-3 rounded-sm bg-gray-100 dark:bg-gray-700"></span>
        {m.stats_sentences_legend_new()}
      </span>
    </div>
  {/if}
</section>
