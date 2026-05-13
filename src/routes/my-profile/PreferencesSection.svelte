<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Profile } from '$lib/server/profile';
  import { setLocale } from '$lib/paraglide/runtime';

  let { profile }: { profile: Profile | null } = $props();

  let saving = $state(false);
  let saved = $state(false);
  let errorMsg = $state('');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  // Derive defaults from the profile prop so they stay reactive if the prop changes.
  let targetLevel = $derived(profile?.target_level ?? 'B1');
  let uiLanguage = $derived(profile?.ui_language ?? 'en');
  let cardDirection = $derived(profile?.card_direction ?? 'no_en');
  // include_phrases: true → 'phrase', false → 'word'
  let cardType = $derived((profile?.include_phrases ?? false) ? 'phrase' : 'word');

  function applyToLocalStorage() {
    localStorage.setItem('vocab-flashcard-mode', cardDirection === 'en_no' ? 'engnor' : 'noreng');
    localStorage.setItem('vocab-flashcard-card-type', cardType);
    localStorage.setItem('locale', uiLanguage);
    setLocale(uiLanguage, { reload: false });
  }
</script>

<section
  class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
>
  <h2 class="mb-5 text-base font-semibold text-gray-800 dark:text-gray-100">Preferences</h2>

  <form
    method="POST"
    action="?/updatePreferences"
    use:enhance={() => {
      saving = true;
      saved = false;
      errorMsg = '';
      applyToLocalStorage();
      return async ({ result, update }) => {
        saving = false;
        if (result.type === 'success') {
          saved = true;
          setTimeout(() => (saved = false), 2500);
        } else if (result.type === 'failure') {
          errorMsg = (result.data?.message as string) ?? 'Failed to save.';
        }
        // Don't invalidateAll — it causes the component to re-init from
        // the profile prop mid-flight, dropping the local $state values.
        await update({ reset: false });
      };
    }}
    class="space-y-6"
  >
    <!-- Target level -->
    <div>
      <label
        for="target_level"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Target level
      </label>
      <select
        id="target_level"
        name="target_level"
        bind:value={targetLevel}
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
      >
        {#each levels as level (level)}
          <option value={level}>{level}</option>
        {/each}
      </select>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Used for pace forecasting on your progress page.
      </p>
    </div>

    <!-- Interface language -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Interface language
      </p>
      <div class="flex gap-3">
        {#each [{ value: 'en', label: '🇺🇸 English' }, { value: 'nb', label: '🇳🇴 Norsk Bokmål' }] as opt (opt.value)}
          <label class="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="ui_language"
              value={opt.value}
              bind:group={uiLanguage}
              class="accent-indigo-600"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
          </label>
        {/each}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Saves your preference and switches the interface immediately.
      </p>
    </div>

    <!-- Card direction -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Card direction</p>
      <div class="flex gap-3">
        {#each [{ value: 'no_en', label: 'Norwegian → English' }, { value: 'en_no', label: 'English → Norwegian' }] as opt (opt.value)}
          <label class="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="card_direction"
              value={opt.value}
              bind:group={cardDirection}
              class="accent-indigo-600"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
          </label>
        {/each}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Takes effect on the next flashcard deck you open.
      </p>
    </div>

    <!-- Card type -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Card type</p>
      <div class="flex gap-3">
        {#each [{ value: 'word', label: 'Word' }, { value: 'phrase', label: 'Phrase' }] as opt (opt.value)}
          <label class="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="card_type"
              value={opt.value}
              bind:group={cardType}
              class="accent-indigo-600"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
          </label>
        {/each}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Default card type shown when you open a deck.
      </p>
    </div>

    {#if errorMsg}
      <p class="text-xs text-red-500">{errorMsg}</p>
    {/if}

    <button
      type="submit"
      disabled={saving}
      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
    </button>
  </form>
</section>
