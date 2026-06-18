<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';
  import { languageStore } from '$lib/stores/language.svelte';
  import { LANGUAGES, languageEntryForLocale } from '$lib/config';
  import type { FlashcardLanguage } from '$lib/types';

  // No props — ipCountry removed (decision 9 in new-languages.md).

  // Local open state — set to false to instantly close the modal without
  // waiting for invalidateAll() / goto() to re-run the layout load.
  let open = $state(true);

  // --- Slide definitions ---
  // Slides 1–3 collect data; slide 4 is the "let's get started" completion
  // screen and isn't counted in the step indicator (TOTAL stays 3).
  type Slide = 1 | 2 | 3 | 4;
  const TOTAL = 3;

  // --- State ---
  let current = $state<Slide>(1);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Slide 1
  let displayName = $state('');

  // Slide 2
  let currentLevel = $state('');

  // Slide 3
  let studyGoals = $state<string[]>([]);

  // Slide 4 (completion screen) — toggles the "browse all levels" fallback
  let showAllLevels = $state(false);

  // flashcard_language: derived from the chosen UI locale — mirrors the
  // LANGUAGES key whose code matches localeStore.current, except 'norwegian'
  // (not a valid flashcard language) which falls back to 'english'.
  function defaultFlashcardLanguage(localeCode: string): FlashcardLanguage {
    const entry = languageEntryForLocale(localeCode);
    const key = entry?.[0];
    return key && key !== 'norwegian' ? (key as FlashcardLanguage) : 'english';
  }

  let flashcardLanguage = $state<FlashcardLanguage>(defaultFlashcardLanguage(localeStore.current));

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'] as const;

  const STUDY_GOALS = [
    { key: 'vocab', label: () => m.onboarding_goal_vocab() },
    { key: 'grammar', label: () => m.onboarding_goal_grammar() },
    { key: 'speaking', label: () => m.onboarding_goal_speaking() },
    { key: 'listening', label: () => m.onboarding_goal_listening() },
    { key: 'writing', label: () => m.onboarding_goal_writing() }
  ];

  function toggleGoal(key: string) {
    if (studyGoals.includes(key)) {
      studyGoals = studyGoals.filter((g) => g !== key);
    } else if (studyGoals.length < 3) {
      studyGoals = [...studyGoals, key];
    }
  }

  // Maps a CEFR level to its category-overview page.
  function levelHref(level: string): string {
    return level === 'C' ? '/learn/c' : `/learn/${level.toLowerCase()}`;
  }

  // --- Can advance? ---
  const canAdvance = $derived(() => {
    if (current === 1) return displayName.trim().length > 0;
    if (current === 2) return currentLevel.length > 0;
    if (current === 3) return studyGoals.length > 0;
    return false;
  });

  // --- PATCH helper ---
  async function patch(payload: Record<string, unknown>) {
    saving = true;
    error = null;
    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        error = body.message ?? m.onboarding_error_save();
      }
    } catch {
      error = m.onboarding_error_save();
    } finally {
      saving = false;
    }
  }

  // --- Navigation ---
  async function next() {
    if (!canAdvance()) return;

    if (current === 1) {
      // Persist display name and the derived flashcard language together
      await patch({ display_name: displayName.trim(), flashcard_language: flashcardLanguage });
      if (!error) {
        // Immediately update the local store so flashcard pages pick it up
        languageStore.set(flashcardLanguage);
      }
    } else if (current === 2) {
      const patchBody: Record<string, unknown> = { current_level: currentLevel };
      // Nudge toward definition mode for B1+ users who also chose a Norwegian UI
      if (localeStore.current === 'nb' && currentLevel !== 'A1' && currentLevel !== 'A2') {
        patchBody.card_direction = 'def_l1';
      }
      await patch(patchBody);
    } else if (current === 3) {
      await patch({ study_goals: studyGoals, onboarding_done: true });
      if (!error) {
        // Show the "let's get started" completion screen instead of closing.
        // Deliberately not calling invalidateAll() here — that would flip
        // onboardingDone to true in the layout and unmount this component
        // before slide 4 ever renders.
        current = 4;
        return;
      }
    }

    if (!error && current < TOTAL) {
      current = (current + 1) as Slide;
    }
  }

  function back() {
    if (current > 1) current = (current - 1) as Slide;
  }

  async function snooze() {
    await patch({ onboarding_snoozed_at: new Date().toISOString() });
    if (!error) await invalidateAll();
  }

  // Dismiss the completion screen — close instantly via local state.
  function dismissCompletion() {
    open = false;
  }

  // --- Locale switching (slide 1) ---
  async function switchLocale(code: string) {
    localeStore.set(code as typeof localeStore.current);
    // Update derived flashcard language whenever UI language changes
    flashcardLanguage = defaultFlashcardLanguage(code);
    try {
      await fetch('/api/profile/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: code })
      });
    } catch {
      // non-fatal
    }
  }
</script>

{#if open}
  <!-- Full-screen overlay -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label={m.onboarding_aria_label()}
  >
    <div
      class="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white px-8 py-10 shadow-2xl dark:bg-gray-900"
    >
      <!-- Close / snooze button -->
      <button
        type="button"
        onclick={current === 4 ? dismissCompletion : snooze}
        aria-label={current === 4 ? m.onboarding_close_aria_done() : m.onboarding_close_aria()}
        class="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Progress indicator (slides 1–3 only — slide 4 is the completion screen) -->
      {#if current <= TOTAL}
        <div class="mb-6 mt-10 flex items-center gap-1.5">
          {#each Array(TOTAL) as _, i (i)}
            <div
              class="h-1.5 flex-1 rounded-full transition-colors duration-300 {i + 1 <= current
                ? 'bg-indigo-600'
                : 'bg-gray-200 dark:bg-gray-700'}"
            ></div>
          {/each}
        </div>
        <p class="mb-4 text-xs text-gray-400 dark:text-gray-500">
          {m.onboarding_step({ current, total: TOTAL })}
        </p>
      {/if}

      <!-- ── Slide 1: UI language + display name ── -->
      {#if current === 1}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s1_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{m.onboarding_s1_sub()}</p>

        <div class="mb-5">
          <p class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {m.onboarding_s1_lang_label()}
          </p>
          <!-- Dropdown over all 4 LANGUAGES (replaces the 2-button en/nb toggle) -->
          <select
            bind:value={localeStore.current}
            onchange={(e) => {
              const code = (e.target as HTMLSelectElement).value;
              switchLocale(code);
            }}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
              <option value={code}>{flag} {name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label
            for="onb-name"
            class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {m.onboarding_s1_name_label()}
          </label>
          <input
            id="onb-name"
            type="text"
            maxlength="40"
            placeholder={m.onboarding_s1_name_placeholder()}
            bind:value={displayName}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onkeydown={(e) => {
              if (e.key === 'Enter') next();
            }}
          />
        </div>

        <!-- ── Slide 2: Norwegian level ── -->
      {:else if current === 2}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s4_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{m.onboarding_s4_sub()}</p>
        <div class="flex flex-col gap-2">
          {#each LEVELS as level (level)}
            <button
              type="button"
              onclick={() => {
                currentLevel = level;
              }}
              aria-pressed={currentLevel === level}
              class="rounded-xl border-2 px-5 py-3 text-left text-sm font-medium transition-colors {currentLevel ===
              level
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:text-gray-400'}"
            >
              {level}
            </button>
          {/each}
        </div>

        <!-- ── Slide 3: Study goals ── -->
      {:else if current === 3}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s5_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{m.onboarding_s5_sub()}</p>
        <div class="flex flex-col gap-2">
          {#each STUDY_GOALS as goal (goal.key)}
            {@const selected = studyGoals.includes(goal.key)}
            {@const maxed = studyGoals.length >= 3 && !selected}
            <button
              type="button"
              disabled={maxed}
              onclick={() => toggleGoal(goal.key)}
              aria-pressed={selected}
              class="rounded-xl border-2 px-5 py-3 text-left text-sm font-medium transition-colors {selected
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : maxed
                  ? 'cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-600'
                  : 'border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:text-gray-400'}"
            >
              {goal.label()}
            </button>
          {/each}
        </div>

        <!-- ── Slide 4: Completion ── -->
      {:else if current === 4}
        <div class="flex flex-col items-center py-4 text-center">
          <div class="mb-4 text-5xl" aria-hidden="true">🎉</div>
          <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
            {m.onboarding_s7_heading()}
          </h2>
          <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">
            {m.onboarding_s7_sub()}
          </p>

          <button
            type="button"
            onclick={() => {
              dismissCompletion();
              window.location.href = levelHref(currentLevel);
            }}
            class="w-full rounded-xl bg-indigo-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {m.onboarding_s7_start({ level: currentLevel })}
          </button>

          <button
            type="button"
            onclick={() => (showAllLevels = !showAllLevels)}
            aria-expanded={showAllLevels}
            class="mt-4 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {m.onboarding_s7_browse()}
          </button>

          {#if showAllLevels}
            <div class="mt-3 flex flex-wrap justify-center gap-2">
              {#each LEVELS as level (level)}
                <button
                  type="button"
                  onclick={() => {
                    dismissCompletion();
                    window.location.href = levelHref(level);
                  }}
                  class="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400"
                >
                  {level}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Error message -->
      {#if error}
        <p class="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      {/if}

      <!-- Navigation buttons (slides 1–3 only — slide 4 uses its own CTAs above) -->
      {#if current <= TOTAL}
        <div class="mt-8 flex items-center justify-between">
          {#if current > 1}
            <button
              type="button"
              onclick={back}
              class="text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← {m.onboarding_back()}
            </button>
          {:else}
            <span></span>
          {/if}

          <button
            type="button"
            onclick={next}
            disabled={!canAdvance() || saving}
            class="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? m.onboarding_saving()
              : current === TOTAL
                ? m.onboarding_finish()
                : m.onboarding_next()}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
