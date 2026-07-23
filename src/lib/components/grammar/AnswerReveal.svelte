<script lang="ts">
  import type { GrammarQuestion, GrammarRule } from '$lib/types';

  let {
    question,
    rule,
    isCorrect,
    userAnswer,
    isLast,
    onnext
  }: {
    question: GrammarQuestion;
    rule: GrammarRule | undefined;
    isCorrect: boolean;
    userAnswer: string;
    isLast: boolean;
    onnext: () => void;
  } = $props();

  // Grammar questions are Norwegian-only at every level (see
  // ai-docs/implementation/grammar-with-only-norsk.md).
  let ruleTitle = $derived(rule ? rule.titleNb : '');
  let ruleText = $derived(rule ? rule.explanationNb : '');
</script>

<div
  class="rounded-2xl border p-6 shadow-sm {isCorrect
    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
    : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'}"
>
  <div class="mb-4 flex items-center gap-2">
    {#if isCorrect}
      <span class="text-2xl">✓</span>
      <span class="font-semibold text-green-700 dark:text-green-300">Riktig!</span>
    {:else}
      <span class="text-2xl">✗</span>
      <span class="font-semibold text-red-700 dark:text-red-300">Ikke helt.</span>
    {/if}
  </div>

  <p class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
    Riktig svar
  </p>
  {#if question.type === 'minimal-pair'}
    <p class="mb-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
      Option {question.answer}
    </p>
    <p class="mb-4 text-xl font-bold text-gray-800 dark:text-white">
      {question.answer === 'A' ? question.optionA : question.optionB}
    </p>
    {#if question.explanation}
      <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">{question.explanation}</p>
    {/if}
  {:else}
    <p class="mb-4 text-xl font-bold text-gray-800 dark:text-white">{question.answer}</p>
  {/if}

  {#if !isCorrect && userAnswer}
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
      Du skrev:
      <span class="font-medium text-gray-700 dark:text-gray-200">{userAnswer}</span>
    </p>
  {/if}

  {#if !isCorrect && question.hint}
    <p class="mb-4 text-sm text-indigo-600 dark:text-indigo-300">💡 {question.hint}</p>
  {/if}

  {#if rule}
    <div class="rounded-lg bg-white/60 px-4 py-3 dark:bg-indigo-950/60">
      <p
        class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
      >
        Hvorfor · {ruleTitle}
      </p>
      <p class="text-sm text-gray-700 dark:text-gray-300">{ruleText}</p>
      {#if rule.blogSlug}
        <a
          href={`/blog/${rule.blogSlug}`}
          class="mt-2 inline-block text-xs font-medium text-indigo-500 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Les mer →
        </a>
      {/if}
    </div>
  {/if}

  <div class="mt-5 flex items-center justify-end">
    <button
      type="button"
      onclick={onnext}
      class="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none"
    >
      {isLast ? 'Se resultater' : 'Neste →'}
    </button>
  </div>
  <p class="mt-2 text-right text-xs text-gray-700 dark:text-gray-300">
    Mellomrom eller Enter for å fortsette
  </p>
</div>
