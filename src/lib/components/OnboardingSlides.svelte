<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';
  import { languageStore } from '$lib/stores/language.svelte';
  import { LANGUAGES, FLASHCARD_LANGUAGES, languageEntryForLocale } from '$lib/config';
  import type { FlashcardLanguage } from '$lib/types';

  // Local open state — set to false to instantly close the modal without
  // waiting for invalidateAll() / goto() to re-run the layout load.
  let open = $state(true);

  // --- Slide definitions ---
  // Slides 1–4 collect data; slide 5 is the completion screen and isn't
  // counted in the step indicator (TOTAL stays 4).
  type Slide = 1 | 2 | 3 | 4 | 5;
  const TOTAL = 4;

  // --- State ---
  let current = $state<Slide>(1);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Slide 2
  let displayName = $state('');

  // Slide 3 — flashcard language
  // Derived from the chosen UI locale by default; user can override on slide 3.
  function defaultFlashcardLanguage(localeCode: string): FlashcardLanguage {
    const entry = languageEntryForLocale(localeCode);
    const key = entry?.[0];
    return key && key !== 'norwegian' ? (key as FlashcardLanguage) : 'english';
  }

  let flashcardLanguage = $state<FlashcardLanguage>(defaultFlashcardLanguage(localeStore.current));

  // Slide 4
  let currentLevel = $state('');

  // Completion screen
  let showAllLevels = $state(false);

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'] as const;

  function levelHref(level: string): string {
    return level === 'C' ? '/learn/c' : `/learn/${level.toLowerCase()}`;
  }

  // --- Can advance? ---
  const canAdvance = $derived(() => {
    if (current === 1) return true; // language picker — always valid
    if (current === 2) return displayName.trim().length > 0;
    if (current === 3) return true; // flashcard language — always has a selection
    if (current === 4) return currentLevel.length > 0;
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
      // Locale already persisted by switchLocale() on change — nothing extra to save here
    } else if (current === 2) {
      await patch({ display_name: displayName.trim() });
    } else if (current === 3) {
      await patch({ flashcard_language: flashcardLanguage });
      if (!error) {
        languageStore.set(flashcardLanguage);
      }
    } else if (current === 4) {
      const patchBody: Record<string, unknown> = {
        current_level: currentLevel,
        onboarding_done: true
      };
      // Nudge toward definition mode for B1+ users who chose a Norwegian UI
      if (localeStore.current === 'nb' && currentLevel !== 'A1' && currentLevel !== 'A2') {
        patchBody.card_direction = 'def_l1';
      }
      await patch(patchBody);
      if (!error) {
        current = 5;
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

  function dismissCompletion() {
    open = false;
  }

  // --- Locale switching (slide 1) ---
  async function switchLocale(code: string) {
    localeStore.set(code as typeof localeStore.current);
    // Keep flashcard language in sync with the UI language default
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
        onclick={current === 5 ? dismissCompletion : snooze}
        aria-label={current === 5 ? m.onboarding_close_aria_done() : m.onboarding_close_aria()}
        class="absolute right-4 top-4 rounded-full p-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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

      <!-- Progress indicator (slides 1–4 only) -->
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
        <p class="mb-4 text-xs text-gray-700 dark:text-gray-300">
          {m.onboarding_step({ current, total: TOTAL })}
        </p>
      {/if}

      <!-- ── Slide 1: UI language ── -->
      {#if current === 1}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s1_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">{m.onboarding_s1_sub()}</p>

        <p class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {m.onboarding_s1_lang_label()}
        </p>
        <div class="flex flex-col gap-2">
          {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
            <button
              type="button"
              onclick={() => switchLocale(code)}
              aria-pressed={localeStore.current === code}
              class="flex items-center gap-3 rounded-xl border-2 px-5 py-3 text-left text-sm font-medium transition-colors {localeStore.current ===
              code
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:text-gray-400'}"
            >
              <span class="text-xl">{flag}</span>
              <span>{name}</span>
            </button>
          {/each}
        </div>

        <!-- ── Slide 2: Display name ── -->
      {:else if current === 2}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s2_name_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">{m.onboarding_s2_name_sub()}</p>

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

        <!-- ── Slide 3: Flashcard language ── -->
      {:else if current === 3}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s3_flashcard_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {m.onboarding_s3_flashcard_sub()}
        </p>

        <div class="flex flex-col gap-2">
          {#each Object.entries(FLASHCARD_LANGUAGES) as [key, { name, flag }] (key)}
            <button
              type="button"
              onclick={() => (flashcardLanguage = key as FlashcardLanguage)}
              aria-pressed={flashcardLanguage === key}
              class="flex items-center gap-3 rounded-xl border-2 px-5 py-3 text-left text-sm font-medium transition-colors {flashcardLanguage ===
              key
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:text-gray-400'}"
            >
              <span class="text-xl">{flag}</span>
              <span>{name}</span>
            </button>
          {/each}
        </div>

        <!-- ── Slide 4: Norwegian level ── -->
      {:else if current === 4}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s4_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">{m.onboarding_s4_sub()}</p>
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

        <!-- ── Slide 5: Completion ── -->
      {:else if current === 5}
        <div class="flex flex-col items-center py-4 text-center">
          <div class="mb-4 text-5xl" aria-hidden="true">🎉</div>
          <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
            {m.onboarding_s7_heading()}
          </h2>
          <p class="mb-8 text-sm text-gray-600 dark:text-gray-300">
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
            class="mt-4 text-xs font-medium text-gray-700 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-400"
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

      <!-- Navigation buttons (slides 1–4 only) -->
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
