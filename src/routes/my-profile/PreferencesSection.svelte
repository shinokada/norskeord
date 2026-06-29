<script lang="ts">
  import { untrack } from 'svelte';
  import type { Profile } from '$lib/server/profile';
  import { localeStore } from '$lib/localeStore.svelte';
  import { languageStore } from '$lib/stores/language.svelte';
  import { LANGUAGES, FLASHCARD_LANGUAGES } from '$lib/config';
  import type { FlashcardLanguage } from '$lib/types';
  import * as m from '$lib/paraglide/messages.js';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let {
    profile,
    missingFields: _missingFields = []
  }: { profile: Profile | null; missingFields: string[] } = $props();

  // Track whether this is the first render so $effect doesn't auto-save on mount.
  let mounted = false;

  const levels = ['A1', 'A2', 'B1', 'B2', 'C'] as const;
  const B1_PLUS_LEVELS = new Set(['B1', 'B2', 'C']);

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

  // All fields as $state so they can be bound and trigger saves.
  // untrack() seeds from the profile prop without creating a reactive dependency
  // (intentional — we own these values after mount).
  let currentLevel = $state(untrack(() => profile?.current_level ?? 'B1'));
  let uiLanguage = $state(untrack(() => localeStore.current));
  let flashcardLanguage = $state<FlashcardLanguage>(
    untrack(() => (profile?.flashcard_language ?? languageStore.current) as FlashcardLanguage)
  );
  let cardDirection = $state(untrack(() => profile?.card_direction ?? 'l1_l2'));
  let cardType = $state(untrack(() => ((profile?.include_phrases ?? false) ? 'phrase' : 'word')));
  let voiceSpeed = $state(untrack(() => String(profile?.voice_speed ?? 1)));
  let voicePitch = $state(untrack(() => String(profile?.voice_pitch ?? 1)));
  let sessionLimit = $state(
    untrack(() => (profile?.session_limit != null ? String(profile.session_limit) : '20'))
  );
  let quizLimit = $state(
    untrack(() => (profile?.quiz_limit != null ? String(profile.quiz_limit) : 'default'))
  );
  let showExample = $state(untrack(() => profile?.show_example ?? false));

  const sessionLimitOptions = [
    { value: '10', label: '10 cards' },
    { value: '20', label: '20 cards (default)' },
    { value: '30', label: '30 cards' },
    { value: '50', label: '50 cards' },
    { value: 'all', label: 'All cards' }
  ];

  const quizLimitOptions = [
    { value: '5', label: '5 questions' },
    { value: 'default', label: '10 questions (default)' },
    { value: '15', label: '15 questions' },
    { value: '20', label: '20 questions' }
  ];

  let cardDirectionOptions = $derived.by(() => {
    const l2Name = LANGUAGES[flashcardLanguage].name;
    const base = [
      { value: 'l1_l2', label: `Norsk → ${l2Name}` },
      { value: 'l2_l1', label: `${l2Name} → Norsk` }
    ];
    if (cardType === 'word' && B1_PLUS_LEVELS.has(currentLevel)) {
      return [...base, { value: 'def_l1', label: m.profile_prefs_card_direction_def_no() }];
    }
    return base;
  });

  // If def_l1 is selected but the user switches to phrase or A1/A2, fall back to l1_l2.
  let effectiveCardDirection = $derived(
    cardDirection === 'def_l1' && (cardType !== 'word' || !B1_PLUS_LEVELS.has(currentLevel))
      ? 'l1_l2'
      : cardDirection
  );

  // Whether to show the definition-mode explanatory note.
  let showDefNote = $derived(cardType === 'word' && B1_PLUS_LEVELS.has(currentLevel));

  function applyToLocalStorage() {
    const modeMap: Record<string, string> = { l1_l2: 'noreng', l2_l1: 'engnor', def_l1: 'defnor' };
    localStorage.setItem('vocab-flashcard-mode', modeMap[effectiveCardDirection] ?? 'noreng');
    localStorage.setItem('vocab-flashcard-card-type', cardType);
    localStorage.setItem(LS_SPEED, voiceSpeed);
    localStorage.setItem(LS_PITCH, voicePitch);
    localStorage.setItem('vocab-flashcard-session-limit', sessionLimit);
    localStorage.setItem('vocab-quiz-limit', quizLimit);
    localStorage.setItem('vocab-flashcard-show-example', String(showExample));
    localeStore.set(uiLanguage);
    languageStore.set(flashcardLanguage);
  }

  async function savePreferences() {
    applyToLocalStorage();

    const body = new FormData();
    body.append('current_level', currentLevel);
    body.append('ui_language', uiLanguage);
    body.append('flashcard_language', flashcardLanguage);
    body.append('card_direction', effectiveCardDirection);
    body.append('card_type', cardType);
    body.append('voice_speed', voiceSpeed);
    body.append('voice_pitch', voicePitch);
    body.append('session_limit', sessionLimit);
    body.append('quiz_limit', quizLimit);
    if (showExample) body.append('show_example', 'true');

    try {
      const res = await fetch('?/updatePreferences', { method: 'POST', body });
      if (!res.ok) throw new Error();
      toast.show(m.profile_saved());
    } catch {
      toast.show(m.profile_error_generic(), 'error');
    }
  }

  // Auto-save whenever any preference value changes — but not on the initial render.
  $effect(() => {
    // Establish reactive dependencies on all fields.
    const _ = [
      currentLevel,
      uiLanguage,
      flashcardLanguage,
      cardDirection,
      cardType,
      voiceSpeed,
      voicePitch,
      sessionLimit,
      quizLimit,
      showExample
    ];
    if (!mounted) {
      mounted = true;
      return;
    }
    savePreferences();
  });
</script>

<section
  class="rounded-xl border border-gray-200 bg-gray-50 px-6 pb-6 pt-4 dark:border-white/10 dark:bg-indigo-950/60"
>
  <h2 class="mb-5 font-semibold text-gray-800 dark:text-gray-100">
    {m.profile_prefs_heading()}
  </h2>

  <div class="space-y-6">
    <!-- Target level -->
    <div>
      <label
        for="current_level"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {m.profile_prefs_target_level()}
      </label>
      <select
        id="current_level"
        name="current_level"
        bind:value={currentLevel}
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100"
      >
        {#each levels as level (level)}
          <option value={level}>{level}</option>
        {/each}
      </select>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        {m.profile_prefs_target_level_hint()}
      </p>
    </div>

    <!-- Interface language -->
    <div>
      <label
        for="ui_language"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {m.profile_prefs_ui_language()}
      </label>
      <select
        id="ui_language"
        name="ui_language"
        bind:value={uiLanguage}
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100"
      >
        {#each Object.entries(LANGUAGES) as [, { name, flag, code }] (code)}
          <option value={code}>{flag} {name}</option>
        {/each}
      </select>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        {m.profile_prefs_ui_language_hint()}
      </p>
    </div>

    <!-- Flashcard language -->
    <div>
      <label
        for="flashcard_language"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Flashcard language
      </label>
      <select
        id="flashcard_language"
        name="flashcard_language"
        bind:value={flashcardLanguage}
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100"
      >
        {#each Object.entries(FLASHCARD_LANGUAGES) as [key, { name, flag }] (key)}
          <option value={key}>{flag} {name}</option>
        {/each}
      </select>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        The language your flashcards are translated into.
      </p>
    </div>

    <!-- Card direction -->
    <div>
      <SegmentedControl
        name="card_direction"
        label={m.profile_prefs_card_direction()}
        options={cardDirectionOptions}
        bind:selected={cardDirection}
        hint={m.profile_prefs_card_direction_hint()}
      />
      {#if showDefNote}
        <p class="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
          {m.profile_prefs_card_direction_def_note()}
        </p>
      {/if}
    </div>

    <!-- Card type -->
    <SegmentedControl
      name="card_type"
      label={m.profile_prefs_card_type()}
      options={[
        { value: 'word', label: m.profile_prefs_card_type_word() },
        { value: 'phrase', label: m.profile_prefs_card_type_phrase() }
      ]}
      bind:selected={cardType}
      hint={m.profile_prefs_card_type_hint()}
    />

    <!-- Pronunciation speed -->
    <SegmentedControl
      name="voice_speed"
      label={m.profile_prefs_voice_speed()}
      options={speedOptions}
      bind:selected={voiceSpeed}
      hint={m.profile_prefs_voice_speed_hint()}
    />

    <!-- Pronunciation tone -->
    <SegmentedControl
      name="voice_pitch"
      label={m.profile_prefs_voice_tone()}
      options={toneOptions}
      bind:selected={voicePitch}
      hint={m.profile_prefs_voice_tone_hint()}
    />

    <!-- Session card limit -->
    <div>
      <label
        for="session_limit"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {m.profile_prefs_session_limit()}
      </label>
      <select
        id="session_limit"
        name="session_limit"
        bind:value={sessionLimit}
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100"
      >
        {#each sessionLimitOptions as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        {m.profile_prefs_session_limit_hint()}
      </p>
    </div>

    <!-- Quiz questions per session -->
    <div>
      <label
        for="quiz_limit"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {m.profile_prefs_quiz_limit()}
      </label>
      <select
        id="quiz_limit"
        name="quiz_limit"
        bind:value={quizLimit}
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-white/20 dark:bg-indigo-900/30 dark:text-gray-100"
      >
        {#each quizLimitOptions as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        {m.profile_prefs_quiz_limit_hint()}
      </p>
    </div>

    <!-- Show example translation by default -->
    <Toggle
      name="show_example"
      label={m.profile_prefs_show_example_label()}
      bind:checked={showExample}
      hint={m.profile_prefs_show_example_hint()}
    />
  </div>
</section>
