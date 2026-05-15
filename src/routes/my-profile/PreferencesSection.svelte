<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Profile } from '$lib/server/profile';
  import { localeStore } from '$lib/localeStore.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { profile }: { profile: Profile | null } = $props();

  let saving = $state(false);
  let saved = $state(false);
  let errorMsg = $state('');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  const speedOptions = [
    { value: '0.5', label: '0.5×' },
    { value: '0.75', label: '0.75×' },
    { value: '1', label: '1×' },
    { value: '1.25', label: '1.25×' },
    { value: '1.5', label: '1.5×' }
  ];

  const toneOptions = [
    { value: '0.7', label: 'Low' },
    { value: '1', label: 'Default' },
    { value: '1.3', label: 'High' }
  ];

  const LS_SPEED = 'voice-settings-speed';
  const LS_PITCH = 'voice-settings-pitch';

  // Derive defaults from the profile prop so they stay reactive if the prop changes.
  let targetLevel = $derived(profile?.target_level ?? 'B1');
  // uiLanguage uses writable $derived so the radio can be changed freely
  // before saving while staying in sync with the nav button toggle.
  // Written back to the store on save via applyToLocalStorage().
  let uiLanguage = $derived.by<'en' | 'nb'>(() => localeStore.current);
  let cardDirection = $derived(profile?.card_direction ?? 'no_en');
  // include_phrases: true → 'phrase', false → 'word'
  let cardType = $derived((profile?.include_phrases ?? false) ? 'phrase' : 'word');
  let voiceSpeed = $derived(String(profile?.voice_speed ?? 1));
  let voicePitch = $derived(String(profile?.voice_pitch ?? 1));

  function applyToLocalStorage() {
    localStorage.setItem('vocab-flashcard-mode', cardDirection === 'en_no' ? 'engnor' : 'noreng');
    localStorage.setItem('vocab-flashcard-card-type', cardType);
    localStorage.setItem(LS_SPEED, voiceSpeed);
    localStorage.setItem(LS_PITCH, voicePitch);
    // Write through the store so the nav button updates reactively.
    localeStore.set(uiLanguage);
  }
</script>

<section
  class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
>
  <h2 class="mb-5 text-base font-semibold text-gray-800 dark:text-gray-100">
    {m.profile_prefs_heading()}
  </h2>

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
          errorMsg = (result.data?.message as string) ?? m.profile_error_generic();
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
        {m.profile_prefs_target_level()}
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
        {m.profile_prefs_target_level_hint()}
      </p>
    </div>

    <!-- Interface language -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_prefs_ui_language()}
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
        {m.profile_prefs_ui_language_hint()}
      </p>
    </div>

    <!-- Card direction -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_prefs_card_direction()}
      </p>
      <div class="flex gap-3">
        {#each [{ value: 'no_en', label: m.profile_prefs_card_direction_no_en() }, { value: 'en_no', label: m.profile_prefs_card_direction_en_no() }] as opt (opt.value)}
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
        {m.profile_prefs_card_direction_hint()}
      </p>
    </div>

    <!-- Card type -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_prefs_card_type()}
      </p>
      <div class="flex gap-3">
        {#each [{ value: 'word', label: m.profile_prefs_card_type_word() }, { value: 'phrase', label: m.profile_prefs_card_type_phrase() }] as opt (opt.value)}
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
        {m.profile_prefs_card_type_hint()}
      </p>
    </div>

    <!-- Pronunciation speed -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_prefs_voice_speed()}
      </p>
      <div class="flex flex-wrap gap-2">
        {#each speedOptions as opt (opt.value)}
          <label class="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="voice_speed"
              value={opt.value}
              bind:group={voiceSpeed}
              class="accent-indigo-600"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
          </label>
        {/each}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {m.profile_prefs_voice_speed_hint()}
      </p>
    </div>

    <!-- Pronunciation tone -->
    <div>
      <p class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.profile_prefs_voice_tone()}
      </p>
      <div class="flex gap-4">
        {#each toneOptions as opt (opt.value)}
          <label class="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="voice_pitch"
              value={opt.value}
              bind:group={voicePitch}
              class="accent-indigo-600"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
          </label>
        {/each}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {m.profile_prefs_voice_tone_hint()}
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
      {saving ? m.profile_saving() : saved ? m.profile_saved() : m.profile_save()}
    </button>
  </form>
</section>
