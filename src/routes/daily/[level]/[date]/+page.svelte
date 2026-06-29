<script lang="ts">
  import SpeakButton from '$lib/SpeakButton.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const lesson = $derived(data.lesson);

  const levelLabel = $derived(lesson.level_group === 'A' ? 'A1/A2' : 'B1/B2');

  // Exercise state: one answer string and one revealed flag per exercise.
  let answers = $state<Record<number, string>>({});
  let revealed = $state<Record<number, boolean>>({});

  function checkAnswer(i: number): boolean {
    const userAnswer = (answers[i] ?? '').trim().toLowerCase();
    const correct = lesson.exercises[i].answer.trim().toLowerCase();
    return userAnswer === correct;
  }
</script>

<div class="mx-auto max-w-2xl px-4 py-10 text-left">
  <!-- Header -->
  <div class="mb-6">
    <span
      class="text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400"
    >
      {levelLabel} · {lesson.lesson_date}
    </span>
    <h1 class="mt-1 dark:text-white">{lesson.focus_topic}</h1>
  </div>

  <!-- Main text -->
  <section class="mb-8">
    <h2 class="mb-3 tracking-wide text-gray-500 uppercase dark:text-gray-400">Tekst</h2>
    <div
      class="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/40"
    >
      {#each lesson.main_text.split('\n').filter((s: string) => s.trim()) as sentence, i (i)}
        <div class="flex items-start gap-2 {i > 0 ? 'mt-3' : ''}">
          <p class="flex-1 text-base leading-relaxed text-gray-800 dark:text-gray-200">
            {sentence}
          </p>
          <div class="mt-0.5 shrink-0">
            <SpeakButton word={sentence} label="Uttale" />
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Vocabulary -->
  <section class="mb-8">
    <h2 class="mb-3 tracking-wide text-gray-500 uppercase dark:text-gray-400">Ordliste</h2>
    <div
      class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700"
    >
      {#each lesson.vocabulary as item (item.norsk)}
        <div class="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
          <div class="flex items-center gap-2 sm:w-36 sm:shrink-0">
            <span class="font-semibold text-gray-900 dark:text-white">{item.norsk}</span>
            <SpeakButton word={item.norsk} />
          </div>
          <span class="text-sm text-gray-500 sm:w-32 sm:shrink-0 dark:text-gray-400"
            >{item.english}</span
          >
          <span class="text-sm text-gray-600 italic dark:text-gray-300">{item.example}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Exercises -->
  <section>
    <h2 class="mb-3 tracking-wide text-gray-500 uppercase dark:text-gray-400">Øvelser</h2>
    <div class="flex flex-col gap-4">
      {#each lesson.exercises as ex, i (i)}
        <div
          class="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-800/60"
        >
          <p class="mb-3 text-base font-medium text-gray-800 dark:text-gray-200">
            {i + 1}. {ex.prompt}
          </p>

          {#if ex.type === 'multiple_choice' && ex.options}
            <div class="flex flex-col gap-2">
              {#each ex.options as opt (opt)}
                <label
                  class="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="ex-{i}"
                    value={opt}
                    bind:group={answers[i]}
                    class="accent-indigo-600"
                    disabled={revealed[i]}
                  />
                  {opt}
                </label>
              {/each}
            </div>
          {:else}
            <input
              type="text"
              bind:value={answers[i]}
              placeholder="Skriv svaret…"
              disabled={revealed[i]}
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400"
            />
          {/if}

          {#if !revealed[i]}
            <button
              type="button"
              onclick={() => (revealed[i] = true)}
              class="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              Vis svar
            </button>
          {:else}
            <div class="mt-3 flex items-center gap-2">
              {#if ex.type !== 'multiple_choice'}
                <span
                  class="text-sm {checkAnswer(i)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'}"
                >
                  {checkAnswer(i) ? '✓ Riktig!' : '✗ Feil.'}
                </span>
              {/if}
              <span class="text-sm text-gray-600 dark:text-gray-300">
                Svar: <strong class="text-gray-900 dark:text-white">{ex.answer}</strong>
              </span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>
