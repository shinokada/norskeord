<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import type { CardProgress, GrammarQuestion, GrammarRule } from '$lib/types';
  import {
    loadGrammarProgressMap,
    loadGrammarProgressFromSupabase,
    saveGrammarProgress,
    countDueToday
  } from '$lib/progress';
  import { buildGrammarSession, gradeGrammarAnswer } from '$lib/grammar/session';
  import * as m from '$lib/paraglide/messages';
  import FillQuestion from './FillQuestion.svelte';
  import OrderQuestion from './OrderQuestion.svelte';
  import TransformQuestion from './TransformQuestion.svelte';
  import MinimalPairQuestion from './MinimalPairQuestion.svelte';
  import MultipleChoiceQuestion from './MultipleChoiceQuestion.svelte';
  import PunctuationQuestion from './PunctuationQuestion.svelte';
  import AnswerReveal from './AnswerReveal.svelte';
  import GrammarSummary from './GrammarSummary.svelte';

  let {
    questions: pool,
    rule,
    userId
  }: {
    questions: GrammarQuestion[];
    rule: GrammarRule | undefined;
    userId: string | null;
  } = $props();

  type SessionState = 'loading' | 'questioning' | 'revealing' | 'summary';

  interface GrammarResult {
    question: GrammarQuestion;
    correct: boolean;
    userAnswer: string;
  }

  const SESSION_SIZE = 10;

  let sessionState = $state<SessionState>('loading');
  let questions = $state<GrammarQuestion[]>([]);
  let currentIndex = $state(0);
  let progressMap = $state<Record<string, CardProgress>>({});
  let correctCount = $state(0);
  let results = $state<GrammarResult[]>([]);
  let isCorrect = $state<boolean | null>(null);
  let userAnswer = $state('');

  // FSRS review-intensity preset from layout server (0.8/0.9/0.95, or null for
  // default Standard). Only meaningful when userId is set (Plus users).
  let fsrsRetention = $derived((page.data.fsrsRetention as number | null | undefined) ?? null);

  let current = $derived(questions[currentIndex]);
  let progress = $derived(
    questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0
  );
  let dueSoon = $derived(countDueToday(progressMap));

  onMount(() => {
    (async () => {
      if (browser) {
        progressMap = userId
          ? await loadGrammarProgressFromSupabase(userId)
          : loadGrammarProgressMap();
      }
      start();
    })();
  });

  function start() {
    questions = buildGrammarSession(pool, progressMap, SESSION_SIZE);
    currentIndex = 0;
    correctCount = 0;
    results = [];
    isCorrect = null;
    userAnswer = '';
    sessionState = questions.length > 0 ? 'questioning' : 'summary';
  }

  async function submit(answer: string) {
    if (!current || sessionState !== 'questioning') return;
    const { correct, rating } = gradeGrammarAnswer(answer, current);
    userAnswer = answer.trim();
    isCorrect = correct;
    if (correct) correctCount++;
    results = [...results, { question: current, correct, userAnswer }];
    progressMap = await saveGrammarProgress(current, rating, progressMap, userId, fsrsRetention);
    sessionState = 'revealing';
  }

  function next() {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      isCorrect = null;
      userAnswer = '';
      sessionState = 'questioning';
    } else {
      sessionState = 'summary';
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (sessionState === 'revealing' && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      next();
    }
    if (sessionState === 'summary' && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      start();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if sessionState === 'loading'}
  <div class="py-16 text-center text-sm text-gray-600 dark:text-gray-300">…</div>
{:else if sessionState === 'summary'}
  {#if questions.length === 0}
    <p class="py-16 text-center text-sm text-gray-600 dark:text-gray-300">{m.grammar_empty()}</p>
  {:else}
    <GrammarSummary {results} total={questions.length} {correctCount} {dueSoon} onrestart={start} />
  {/if}
{:else if current}
  <!-- Progress bar -->
  <div class="mb-6">
    <div class="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
      <span>{m.grammar_question_count({ current: currentIndex + 1, total: questions.length })}</span
      >
      <span>{m.grammar_correct_so_far({ count: correctCount })}</span>
    </div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        class="h-full rounded-full bg-indigo-500 transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  {#if sessionState === 'questioning'}
    <div
      class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-indigo-950/60"
    >
      {#if current.cefr}
        <span
          class="mb-3 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
        >
          {current.cefr}
        </span>
      {/if}
      {#if current.type === 'fill'}
        <FillQuestion question={current} onsubmit={submit} />
      {:else if current.type === 'order'}
        <OrderQuestion question={current} onsubmit={submit} />
      {:else if current.type === 'minimal-pair'}
        <MinimalPairQuestion question={current} onsubmit={submit} />
      {:else if current.type === 'multiple-choice'}
        <MultipleChoiceQuestion question={current} onsubmit={submit} />
      {:else if current.type === 'punctuation'}
        <PunctuationQuestion question={current} onsubmit={submit} />
      {:else}
        <TransformQuestion question={current} onsubmit={submit} />
      {/if}
    </div>
  {:else if sessionState === 'revealing'}
    <AnswerReveal
      question={current}
      {rule}
      isCorrect={isCorrect ?? false}
      {userAnswer}
      isLast={currentIndex >= questions.length - 1}
      onnext={next}
    />
  {/if}
{/if}
