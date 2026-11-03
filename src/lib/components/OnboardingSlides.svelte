<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';
  import { languageStore } from '$lib/stores/language.svelte';
  import { LANGUAGES, languageEntryForLocale } from '$lib/config';
  import { DEFAULT_POST_LOGIN } from '$lib/post-login';
  import type { FlashcardLanguage } from '$lib/types';

  // Local open state — set to false to instantly close the modal without
  // waiting for the navigation / layout reload to finish.
  let open = $state(true);

  // Three short steps: 1 language, 2 display name (optional), 3 Norwegian level.
  // Finishing saves everything and goes straight to the chosen level page.
  type Slide = 1 | 2 | 3;
  const TOTAL = 3;

  // --- State ---
  let current = $state<Slide>(1);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Step 1 — the language of the interface AND of the flashcard translations.
  // Norwegian is not offered here: a learner needs translations in their own language, and
  // can still switch the interface to Norwegian from the top nav at any time.
  const LANGUAGE_OPTIONS = Object.entries(LANGUAGES).filter(([key]) => key !== 'norwegian');

  function defaultFlashcardLanguage(localeCode: string): FlashcardLanguage {
    const entry = languageEntryForLocale(localeCode);
    const key = entry?.[0];
    return key && key !== 'norwegian' ? (key as FlashcardLanguage) : 'english';
  }

  let flashcardLanguage = $state<FlashcardLanguage>(defaultFlashcardLanguage(localeStore.current));

  // Step 2 — optional. Left empty, the UI falls back to the account email.
  let displayName = $state('');

  // Step 3
  let currentLevel = $state('');

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'] as const;

  function levelHref(level: string): string {
    return level === 'C' ? '/learn/c' : `/learn/${level.toLowerCase()}`;
  }

  // --- Can advance? ---
  const canAdvance = $derived(() => {
    // A visitor whose browser locale is Norwegian has no option highlighted: they must pick one.
    if (current === 1) return LANGUAGE_OPTIONS.some(([, l]) => l.code === localeStore.current);
    if (current === 2) return true; // display name is optional
    return currentLevel.length > 0;
  });

  // --- PATCH helper --- returns true on success
  async function patch(payload: Record<string, unknown>): Promise<boolean> {
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
        return false;
      }
      return true;
    } catch {
      error = m.onboarding_error_save();
      return false;
    } finally {
      saving = false;
    }
  }

  // --- Navigation ---
  async function next() {
    if (!canAdvance() || saving) return;

    if (current === 1) {
      // The interface language is saved when it is picked (switchLocale). Wait for that save;
      // if it failed, try once more here, so "Next" also works as a retry.
      saving = true;
      error = null;
      let localeOk = await localeSave;
      if (!localeOk && pendingLocale) {
        localeOk = await saveLocale(pendingLocale);
        localeSave = Promise.resolve(localeOk);
      }
      saving = false;
      if (!localeOk) {
        error = m.onboarding_error_save();
        return;
      }
      if (!(await patch({ flashcard_language: flashcardLanguage }))) return;
      languageStore.set(flashcardLanguage);
      current = 2;
    } else if (current === 2) {
      const name = displayName.trim();
      if (name && !(await patch({ display_name: name }))) return;
      current = 3;
    } else {
      // The daily email reminder is on for everyone; every email has an unsubscribe link.
      const ok = await patch({
        current_level: currentLevel,
        daily_reminder_enabled: true,
        onboarding_done: true
      });
      if (!ok) return;
      open = false;
      // Only the default landing page (where login sends a new account) moves on to the chosen
      // level. Anywhere else, e.g. the page a guest trial link brought them back to, stay there
      // and reload so the layout picks up the finished onboarding.
      if (window.location.pathname === DEFAULT_POST_LOGIN) {
        window.location.href = levelHref(currentLevel);
      } else {
        window.location.reload();
      }
    }
  }

  function back() {
    if (current > 1) current = (current - 1) as Slide;
  }

  // --- Locale switching (step 1) ---
  // The save is chained, so quick taps on two languages reach the server in order, and the
  // result is kept for next(): a failed save must stop step 1, as every other save does.
  let localeSave: Promise<boolean> = Promise.resolve(true);
  let pendingLocale: string | null = null;

  function saveLocale(code: string): Promise<boolean> {
    return fetch('/api/profile/language', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: code })
    })
      .then((res) => res.ok)
      .catch(() => false);
  }

  function switchLocale(code: string) {
    localeStore.set(code as typeof localeStore.current);
    // Keep the flashcard language in sync with the chosen language
    flashcardLanguage = defaultFlashcardLanguage(code);
    pendingLocale = code;
    localeSave = localeSave.then(() => saveLocale(code));
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
      class="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-8 py-10 shadow-2xl dark:bg-gray-900"
    >
      <!-- Progress indicator -->
      <div class="mt-4 mb-6 flex items-center gap-1.5">
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

      <!-- ── Step 1: language ── -->
      {#if current === 1}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s1_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">{m.onboarding_s1_sub()}</p>

        <p class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {m.onboarding_s1_lang_label()}
        </p>
        <div class="flex flex-col gap-2">
          {#each LANGUAGE_OPTIONS as [, { name, flag, code }] (code)}
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
        <p class="mt-4 text-xs text-gray-600 dark:text-gray-300">{m.onboarding_s1_lang_note()}</p>

        <!-- ── Step 2: display name (optional) ── -->
      {:else if current === 2}
        <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          {m.onboarding_s2_name_heading()}
        </h2>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {m.onboarding_s2_name_sub_optional()}
        </p>

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
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          onkeydown={(e) => {
            if (e.key === 'Enter') next();
          }}
        />

        <!-- ── Step 3: Norwegian level ── -->
      {:else}
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
        <p class="mt-4 text-xs text-gray-600 dark:text-gray-300">
          {m.onboarding_s3_reminder_note()}
        </p>
      {/if}

      <!-- Error message -->
      {#if error}
        <p class="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      {/if}

      <!-- Navigation buttons -->
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
    </div>
  </div>
{/if}
