<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { localeStore } from '$lib/localeStore.svelte';

  // --- Props ---
  let { ipCountry }: { ipCountry: string | null } = $props();

  // Local open state — set to false to instantly close the modal without
  // waiting for invalidateAll() / goto() to re-run the layout load.
  let open = $state(true);

  // --- Slide definitions ---
  // Slides 1–6 collect data; slide 7 is the "let's get started" completion
  // screen and isn't counted in the step indicator (TOTAL stays 6).
  type Slide = 1 | 2 | 3 | 4 | 5 | 6 | 7;
  const TOTAL = 6;

  // --- State ---
  let current = $state<Slide>(1);
  let saving = $state(false);
  let error = $state<string | null>(null);

  // Slide 1
  let displayName = $state('');

  // Slide 2
  let nativeLanguage = $state('');
  let nativeLanguageOther = $state(''); // free-text when "Other" is selected

  // Slide 3
  let otherLanguages = $state<string[]>([]);

  // Slide 4
  let currentLevel = $state('');

  // Slide 5
  let studyGoals = $state<string[]>([]);

  // Slide 6 — untrack() so Svelte doesn't warn about capturing the initial
  // prop value; ipCountry is server-derived and won't change during the session.
  let country = $state(untrack(() => ipCountry ?? ''));

  // Slide 7 (completion screen) — toggles the "browse all levels" fallback
  let showAllLevels = $state(false);

  // --- Language list (ISO 639-1, sorted A–Z by English name) ---
  const LANGUAGES = [
    { code: 'sq', label: 'Albanian / Shqip' },
    { code: 'am', label: 'Amharic / አማርኛ' },
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
    { code: 'kk', label: 'Kazakh / Қазақша' },
    { code: 'ko', label: 'Korean / 한국어' },
    { code: 'ku', label: 'Kurdish / Kurdî' },
    { code: 'lv', label: 'Latvian / Latviešu' },
    { code: 'lt', label: 'Lithuanian / Lietuvių' },
    { code: 'ms', label: 'Malay / Bahasa Melayu' },
    { code: 'ne', label: 'Nepali / नेपाली' },
    { code: 'nb', label: 'Norwegian / Norsk' },
    { code: 'fa', label: 'Persian / فارسی' },
    { code: 'pl', label: 'Polish / Polski' },
    { code: 'pt', label: 'Portuguese / Português' },
    { code: 'ro', label: 'Romanian / Română' },
    { code: 'ru', label: 'Russian / Русский' },
    { code: 'si', label: 'Sinhala / සිංහල' },
    { code: 'so', label: 'Somali / Soomaali' },
    { code: 'es', label: 'Spanish / Español' },
    { code: 'sv', label: 'Swedish / Svenska' },
    { code: 'sw', label: 'Swahili / Kiswahili' },
    { code: 'tl', label: 'Tagalog / Filipino' },
    { code: 'ta', label: 'Tamil / தமிழ்' },
    { code: 'th', label: 'Thai / ภาษาไทย' },
    { code: 'ti', label: 'Tigrinya / ትግርኛ' },
    { code: 'tr', label: 'Turkish / Türkçe' },
    { code: 'uk', label: 'Ukrainian / Українська' },
    { code: 'ur', label: 'Urdu / اردو' },
    { code: 'vi', label: 'Vietnamese / Tiếng Việt' }
  ];

  // The sentinel value used when the user picks "Other"
  const OTHER_CODE = '__other__';

  // Countries (ISO 3166-1 alpha-2, ~60 most relevant)
  const COUNTRIES = [
    { code: 'AF', label: 'Afghanistan' },
    { code: 'AL', label: 'Albania' },
    { code: 'DZ', label: 'Algeria' },
    { code: 'AR', label: 'Argentina' },
    { code: 'AU', label: 'Australia' },
    { code: 'AT', label: 'Austria' },
    { code: 'BD', label: 'Bangladesh' },
    { code: 'BE', label: 'Belgium' },
    { code: 'BR', label: 'Brazil' },
    { code: 'CA', label: 'Canada' },
    { code: 'CL', label: 'Chile' },
    { code: 'CN', label: 'China' },
    { code: 'CO', label: 'Colombia' },
    { code: 'HR', label: 'Croatia' },
    { code: 'CZ', label: 'Czech Republic' },
    { code: 'DK', label: 'Denmark' },
    { code: 'EG', label: 'Egypt' },
    { code: 'ER', label: 'Eritrea' },
    { code: 'ET', label: 'Ethiopia' },
    { code: 'FI', label: 'Finland' },
    { code: 'FR', label: 'France' },
    { code: 'DE', label: 'Germany' },
    { code: 'GH', label: 'Ghana' },
    { code: 'GR', label: 'Greece' },
    { code: 'HU', label: 'Hungary' },
    { code: 'IN', label: 'India' },
    { code: 'ID', label: 'Indonesia' },
    { code: 'IQ', label: 'Iraq' },
    { code: 'IR', label: 'Iran' },
    { code: 'IE', label: 'Ireland' },
    { code: 'IT', label: 'Italy' },
    { code: 'JP', label: 'Japan' },
    { code: 'KE', label: 'Kenya' },
    { code: 'KR', label: 'South Korea' },
    { code: 'LT', label: 'Lithuania' },
    { code: 'LV', label: 'Latvia' },
    { code: 'MX', label: 'Mexico' },
    { code: 'MA', label: 'Morocco' },
    { code: 'NL', label: 'Netherlands' },
    { code: 'NZ', label: 'New Zealand' },
    { code: 'NG', label: 'Nigeria' },
    { code: 'NO', label: 'Norway' },
    { code: 'PK', label: 'Pakistan' },
    { code: 'PH', label: 'Philippines' },
    { code: 'PL', label: 'Poland' },
    { code: 'PT', label: 'Portugal' },
    { code: 'RO', label: 'Romania' },
    { code: 'RU', label: 'Russia' },
    { code: 'SA', label: 'Saudi Arabia' },
    { code: 'SO', label: 'Somalia' },
    { code: 'ZA', label: 'South Africa' },
    { code: 'ES', label: 'Spain' },
    { code: 'LK', label: 'Sri Lanka' },
    { code: 'SE', label: 'Sweden' },
    { code: 'CH', label: 'Switzerland' },
    { code: 'SY', label: 'Syria' },
    { code: 'TH', label: 'Thailand' },
    { code: 'TR', label: 'Turkey' },
    { code: 'UA', label: 'Ukraine' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'US', label: 'United States' },
    { code: 'VN', label: 'Vietnam' }
  ];

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'] as const;

  const STUDY_GOALS = [
    { key: 'vocab', label: () => m.onboarding_goal_vocab() },
    { key: 'grammar', label: () => m.onboarding_goal_grammar() },
    { key: 'speaking', label: () => m.onboarding_goal_speaking() },
    { key: 'listening', label: () => m.onboarding_goal_listening() },
    { key: 'writing', label: () => m.onboarding_goal_writing() }
  ];

  // --- Derived helpers ---

  // The effective native-language value to persist: if "Other" was chosen,
  // store the trimmed free-text string; otherwise store the ISO code.
  const effectiveNativeLanguage = $derived(
    nativeLanguage === OTHER_CODE ? nativeLanguageOther.trim() : nativeLanguage
  );

  // Slide 3 chip list: exclude the chosen native language (or 'other' sentinel)
  // from the selectable "other languages" so users can't double-select it.
  const otherLangOptions = $derived(LANGUAGES.filter((l) => l.code !== nativeLanguage));

  function toggleOtherLang(code: string) {
    if (otherLanguages.includes(code)) {
      otherLanguages = otherLanguages.filter((c) => c !== code);
    } else {
      otherLanguages = [...otherLanguages, code];
    }
  }

  function toggleGoal(key: string) {
    if (studyGoals.includes(key)) {
      studyGoals = studyGoals.filter((g) => g !== key);
    } else if (studyGoals.length < 3) {
      studyGoals = [...studyGoals, key];
    }
  }

  // Maps a CEFR level to its category-overview page. C has no per-letter
  // split (no /learn/c1, /learn/c2 routes) — it's a single combined hub.
  function levelHref(level: string): string {
    return level === 'C' ? '/learn/c' : `/learn/${level.toLowerCase()}`;
  }

  // --- Can advance? ---
  const canAdvance = $derived(() => {
    if (current === 1) return displayName.trim().length > 0;
    if (current === 2) {
      if (nativeLanguage === OTHER_CODE) return nativeLanguageOther.trim().length > 0;
      return nativeLanguage.length > 0;
    }
    if (current === 3) return true; // optional
    if (current === 4) return currentLevel.length > 0;
    if (current === 5) return studyGoals.length > 0;
    if (current === 6) return true; // optional
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
      await patch({ display_name: displayName.trim() });
    } else if (current === 2) {
      await patch({ native_language: effectiveNativeLanguage });
    } else if (current === 3) {
      await patch({ other_languages: otherLanguages });
    } else if (current === 4) {
      await patch({ current_level: currentLevel });
    } else if (current === 5) {
      await patch({ study_goals: studyGoals });
    } else if (current === 6) {
      await patch({ country: country || null, onboarding_done: true });
      if (!error) {
        // Onboarding is saved server-side — show the "let's get started"
        // screen instead of closing immediately. We deliberately don't
        // invalidateAll() here: that would refresh layout data, flip
        // onboardingDone to true, and unmount this component before slide 7
        // ever renders. The modal closes naturally once the person
        // navigates away from slide 7 (see levelHref links + dismissCompletion).
        current = 7;
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

  // Dismiss the slide 7 completion screen — close instantly via local state,
  // then navigate if a destination is provided.
  async function dismissCompletion(href?: string) {
    open = false;
    if (href) goto(href);
  }

  // --- Locale switching (slide 1) ---
  async function switchLocale(code: string) {
    localeStore.set(code as 'en' | 'nb');
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
      onclick={current === 7 ? dismissCompletion : snooze}
      aria-label={current === 7 ? m.onboarding_close_aria_done() : m.onboarding_close_aria()}
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

    <!-- Progress indicator (slides 1–6 only — slide 7 is the completion screen) -->
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
        <!-- <p> instead of <label>: labels a group of buttons, not a single control -->
        <p class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {m.onboarding_s1_lang_label()}
        </p>
        <div class="flex gap-2" role="group" aria-label={m.onboarding_s1_lang_label()}>
          {#each [{ code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'nb', flag: '🇳🇴', label: 'Norsk' }] as lang (lang.code)}
            <button
              type="button"
              onclick={() => switchLocale(lang.code)}
              aria-pressed={localeStore.current === lang.code}
              class="flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors {localeStore.current ===
              lang.code
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-gray-700 dark:text-gray-400'}"
            >
              {lang.flag}
              {lang.label}
            </button>
          {/each}
        </div>
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

      <!-- ── Slide 2: Native language ── -->
    {:else if current === 2}
      <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
        {m.onboarding_s2_heading()}
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{m.onboarding_s2_sub()}</p>
      <label for="onb-native-lang" class="sr-only">{m.onboarding_s2_heading()}</label>
      <select
        id="onb-native-lang"
        bind:value={nativeLanguage}
        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">{m.onboarding_select_placeholder()}</option>
        {#each LANGUAGES as lang (lang.code)}
          <option value={lang.code}>{lang.label}</option>
        {/each}
        <option value={OTHER_CODE}>Other / Annet</option>
      </select>

      {#if nativeLanguage === OTHER_CODE}
        <div class="mt-3">
          <label
            for="onb-native-lang-other"
            class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Please specify / Spesifiser
          </label>
          <input
            id="onb-native-lang-other"
            type="text"
            maxlength="60"
            placeholder="e.g. Tibetan, Wolof…"
            bind:value={nativeLanguageOther}
            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onkeydown={(e) => {
              if (e.key === 'Enter') next();
            }}
          />
        </div>
      {/if}

      <!-- ── Slide 3: Other languages ── -->
    {:else if current === 3}
      <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
        {m.onboarding_s3_heading()}
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{m.onboarding_s3_sub()}</p>
      <div class="flex max-h-60 flex-wrap gap-2 overflow-y-auto">
        {#each otherLangOptions as lang (lang.code)}
          <button
            type="button"
            onclick={() => toggleOtherLang(lang.code)}
            aria-pressed={otherLanguages.includes(lang.code)}
            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {otherLanguages.includes(
              lang.code
            )
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-300 text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-400'}"
          >
            {lang.label}
          </button>
        {/each}
      </div>

      <!-- ── Slide 4: Norwegian level ── -->
    {:else if current === 4}
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

      <!-- ── Slide 5: Study goals ── -->
    {:else if current === 5}
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

      <!-- ── Slide 6: Country ── -->
    {:else if current === 6}
      <h2 class="mb-1 text-xl font-bold text-gray-900 dark:text-white">
        {m.onboarding_s6_heading()}
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">{m.onboarding_s6_sub()}</p>
      <label for="onb-country" class="sr-only">{m.onboarding_s6_heading()}</label>
      <select
        id="onb-country"
        bind:value={country}
        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">{m.onboarding_s6_skip()}</option>
        {#each COUNTRIES as c (c.code)}
          <option value={c.code}>{c.label}</option>
        {/each}
      </select>

      <!-- ── Slide 7: Completion ── -->
    {:else if current === 7}
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
          onclick={() => dismissCompletion(levelHref(currentLevel))}
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
                onclick={() => dismissCompletion(levelHref(level))}
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

    <!-- Navigation buttons (slides 1–6 only — slide 7 uses its own CTAs above) -->
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
