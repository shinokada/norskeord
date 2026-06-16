<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { untrack } from 'svelte';
  import type { Profile } from '$lib/server/profile';
  import * as m from '$lib/paraglide/messages.js';

  let { profile, missingFields }: { profile: Profile | null; missingFields: string[] } = $props();

  const LANGUAGES = [
    { code: 'ar', label: 'Arabic / عربي' },
    { code: 'zh', label: 'Chinese / 中文' },
    { code: 'da', label: 'Danish / Dansk' },
    { code: 'nl', label: 'Dutch / Nederlands' },
    { code: 'en', label: 'English' },
    { code: 'fi', label: 'Finnish / Suomi' },
    { code: 'fr', label: 'French / Français' },
    { code: 'de', label: 'German / Deutsch' },
    { code: 'el', label: 'Greek / Ελληνικά' },
    { code: 'hi', label: 'Hindi / हिन्दी' },
    { code: 'id', label: 'Indonesian / Bahasa Indonesia' },
    { code: 'it', label: 'Italian / Italiano' },
    { code: 'ja', label: 'Japanese / 日本語' },
    { code: 'ko', label: 'Korean / 한국어' },
    { code: 'ms', label: 'Malay / Bahasa Melayu' },
    { code: 'nb', label: 'Norwegian / Norsk' },
    { code: 'fa', label: 'Persian / فارسی' },
    { code: 'pl', label: 'Polish / Polski' },
    { code: 'pt', label: 'Portuguese / Português' },
    { code: 'ro', label: 'Romanian / Română' },
    { code: 'ru', label: 'Russian / Русский' },
    { code: 'es', label: 'Spanish / Español' },
    { code: 'sv', label: 'Swedish / Svenska' },
    { code: 'sw', label: 'Swahili / Kiswahili' },
    { code: 'tl', label: 'Tagalog / Filipino' },
    { code: 'th', label: 'Thai / ภาษาไทย' },
    { code: 'tr', label: 'Turkish / Türkçe' },
    { code: 'uk', label: 'Ukrainian / Українська' },
    { code: 'ur', label: 'Urdu / اردو' },
    { code: 'vi', label: 'Vietnamese / Tiếng Việt' }
  ];

  const STUDY_GOALS = [
    { key: 'vocab', label: () => m.onboarding_goal_vocab() },
    { key: 'grammar', label: () => m.onboarding_goal_grammar() },
    { key: 'speaking', label: () => m.onboarding_goal_speaking() },
    { key: 'listening', label: () => m.onboarding_goal_listening() },
    { key: 'writing', label: () => m.onboarding_goal_writing() }
  ];

  // untrack() — profile is a server-loaded prop that won't change reactively
  // within this component's lifetime; we only want its initial value as seed.
  let nativeLanguage = $state(untrack(() => profile?.native_language ?? ''));
  let studyGoals = $state<string[]>(untrack(() => profile?.study_goals ?? []));

  let saving = $state(false);
  let saved = $state(false);
  let errorMsg = $state('');

  function toggleGoal(key: string) {
    if (studyGoals.includes(key)) {
      studyGoals = studyGoals.filter((g) => g !== key);
    } else if (studyGoals.length < 3) {
      studyGoals = [...studyGoals, key];
    }
  }

  async function save() {
    saving = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          native_language: nativeLanguage || null,
          study_goals: studyGoals
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        errorMsg = body.message ?? m.profile_error_generic();
      } else {
        saved = true;
        setTimeout(() => (saved = false), 2500);
        await invalidateAll();
      }
    } catch {
      errorMsg = m.profile_error_generic();
    } finally {
      saving = false;
    }
  }

  const showNativeLang = $derived(missingFields.includes('native_language'));
  const showStudyGoals = $derived(missingFields.includes('study_goals'));
</script>

<section
  class="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800/40 dark:bg-red-900/10"
>
  <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">
    {m.onboarding_nudge_section_heading()}
  </p>
  <h2 class="mb-5 text-base font-semibold text-gray-800 dark:text-gray-100">
    {m.onboarding_nudge_section_title()}
  </h2>

  <div class="space-y-5">
    {#if showNativeLang}
      <div>
        <label
          for="onb-native"
          class="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {m.onboarding_s2_heading()}
          <span
            class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400"
          >
            {m.onboarding_nudge_field_required()}
          </span>
        </label>
        <select
          id="onb-native"
          bind:value={nativeLanguage}
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none sm:max-w-xs dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100"
        >
          <option value="">{m.onboarding_select_placeholder()}</option>
          {#each LANGUAGES as lang (lang.code)}
            <option value={lang.code}>{lang.label}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if showStudyGoals}
      <div>
        <p
          class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {m.onboarding_s5_heading()}
          <span
            class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400"
          >
            {m.onboarding_nudge_field_required()}
          </span>
        </p>
        <div class="flex flex-wrap gap-2">
          {#each STUDY_GOALS as goal (goal.key)}
            {@const selected = studyGoals.includes(goal.key)}
            {@const maxed = studyGoals.length >= 3 && !selected}
            <button
              type="button"
              disabled={maxed}
              onclick={() => toggleGoal(goal.key)}
              aria-pressed={selected}
              class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {selected
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : maxed
                  ? 'cursor-not-allowed border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-400'}"
            >
              {goal.label()}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if errorMsg}
      <p class="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
    {/if}

    <button
      type="button"
      onclick={save}
      disabled={saving}
      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {saving ? m.profile_saving() : saved ? m.profile_saved() : m.profile_save()}
    </button>
  </div>
</section>
