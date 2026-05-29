<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { CATEGORIES_BY_LEVEL, isPlusCategory } from '$lib/types';
  import { validFlashcardPathPattern } from '$lib/utils';
  import * as m from '$lib/paraglide/messages.js';

  // Only auto-redirect on direct/fresh page loads (from === null),
  // not when the user explicitly navigates home via an in-app link.
  afterNavigate(async ({ from, complete }) => {
    if (from === null) {
      const last = localStorage.getItem('last-flashcard-path');
      if (last && validFlashcardPathPattern.test(last)) {
        try {
          // eslint-disable-next-line svelte/no-navigation-without-resolve
          await goto(last as Parameters<typeof goto>[0], { replaceState: true });
        } catch {
          localStorage.removeItem('last-flashcard-path');
        }
      } else if (last) {
        localStorage.removeItem('last-flashcard-path');
      }
    }
    await complete;
  });

  let user = $derived(page.data.user);
  let isPlus = $derived(page.data.plan === 'plus');

  const levels = [
    { id: 'A1', label: () => m.home_level_a1(), color: 'green' },
    { id: 'A2', label: () => m.home_level_a2(), color: 'teal' },
    { id: 'B1', label: () => m.home_level_b1(), color: 'blue' },
    { id: 'B2', label: () => m.home_level_b2(), color: 'indigo' },
    { id: 'C1', label: () => m.home_level_c1(), color: 'purple' },
    { id: 'C2', label: () => m.home_level_c2(), color: 'pink' }
  ] as const;

  // Paraglide generates one typed function per key, so dynamic lookup isn't
  // possible. We build an explicit map keyed by "level_category" slug instead.
  const categoryNames: Record<string, () => string> = {
    a1_greetings: m.category_a1_greetings,
    a1_numbers: m.category_a1_numbers,
    a1_colors: m.category_a1_colors,
    a1_family: m.category_a1_family,
    a1_body: m.category_a1_body,
    a1_food: m.category_a1_food,
    a1_animals: m.category_a1_animals,
    a1_home: m.category_a1_home,
    'a1_days-months': m['category_a1_days-months'],
    a1_classroom: m.category_a1_classroom,
    a1_adjectives: m.category_a1_adjectives,
    a1_verbs: m.category_a1_verbs,
    'a1_pronouns-and-questions': m['category_a1_pronouns-and-questions'],
    a1_feelings: m.category_a1_feelings,
    a1_weather: m.category_a1_weather,
    a1_transportation: m.category_a1_transportation,
    a2_shopping: m.category_a2_shopping,
    a2_transport: m.category_a2_transport,
    a2_clothing: m.category_a2_clothing,
    a2_hobbies: m.category_a2_hobbies,
    a2_directions: m.category_a2_directions,
    a2_occupations: m.category_a2_occupations,
    a2_sports: m.category_a2_sports,
    a2_health: m.category_a2_health,
    a2_weather: m.category_a2_weather,
    a2_time: m.category_a2_time,
    'a2_descriptive-adjectives': m['category_a2_descriptive-adjectives'],
    a2_cooking: m.category_a2_cooking,
    a2_nature: m.category_a2_nature,
    'a2_house-chores': m['category_a2_house-chores'],
    a2_communication: m.category_a2_communication,
    b1_travel: m.category_b1_travel,
    b1_environment: m.category_b1_environment,
    b1_media: m.category_b1_media,
    b1_culture: m.category_b1_culture,
    b1_technology: m.category_b1_technology,
    b1_relationships: m.category_b1_relationships,
    b1_education: m.category_b1_education,
    b1_work: m.category_b1_work,
    'b1_city-life': m['category_b1_city-life'],
    b1_traditions: m.category_b1_traditions,
    'b1_opinion-adjectives': m['category_b1_opinion-adjectives'],
    'b1_food-cooking-advanced': m['category_b1_food-cooking-advanced'],
    'b1_housing-renting': m['category_b1_housing-renting'],
    'b1_health-body-intermediate': m['category_b1_health-body-intermediate'],
    'b1_finance-banking': m['category_b1_finance-banking'],
    b2_politics: m.category_b2_politics,
    b2_economics: m.category_b2_economics,
    'b2_social-issues': m['category_b2_social-issues'],
    b2_arts: m.category_b2_arts,
    b2_science: m.category_b2_science,
    b2_emotions: m.category_b2_emotions,
    b2_idioms: m.category_b2_idioms,
    b2_history: m.category_b2_history,
    b2_law: m.category_b2_law,
    b2_literature: m.category_b2_literature,
    'b2_advanced-adjectives': m['category_b2_advanced-adjectives'],
    b2_philosophy: m.category_b2_philosophy,
    b2_medicine: m.category_b2_medicine,
    b2_psychology: m.category_b2_psychology,
    b2_business: m.category_b2_business,
    b2_religion: m.category_b2_religion,
    'b2_uttrykk-preview': m['category_b2_uttrykk-preview'],
    b2_uttrykk: m.category_b2_uttrykk,
    c1_philosophy: m.category_c1_philosophy,
    c1_academic: m.category_c1_academic,
    'c1_formal-writing': m['category_c1_formal-writing'],
    c1_rhetoric: m.category_c1_rhetoric,
    'c1_complex-emotions': m['category_c1_complex-emotions'],
    c1_professional: m.category_c1_professional,
    'c1_abstract-concepts': m['category_c1_abstract-concepts'],
    'c1_politics-democracy': m['category_c1_politics-democracy'],
    c1_linguistics: m.category_c1_linguistics,
    'c1_media-journalism': m['category_c1_media-journalism'],
    'c1_architecture-design': m['category_c1_architecture-design'],
    'c1_diplomacy-international': m['category_c1_diplomacy-international'],
    'c1_finance-economics': m['category_c1_finance-economics'],
    'c1_medicine-healthcare': m['category_c1_medicine-healthcare'],
    'c1_psychology-advanced': m['category_c1_psychology-advanced'],
    c2_literary: m.category_c2_literary,
    c2_archaic: m.category_c2_archaic,
    c2_proverbs: m.category_c2_proverbs,
    'c2_highly-formal': m['category_c2_highly-formal'],
    c2_technical: m.category_c2_technical,
    'c2_advanced-law-justice': m['category_c2_advanced-law-justice'],
    'c2_neuroscience-cognition': m['category_c2_neuroscience-cognition'],
    'c2_climate-environment-policy': m['category_c2_climate-environment-policy'],
    'c2_sociology-anthropology': m['category_c2_sociology-anthropology'],
    'c2_advanced-business-strategy': m['category_c2_advanced-business-strategy'],
    'c2_existential-abstract': m['category_c2_existential-abstract']
  };

  function getCategoryName(level: string, cat: string): string {
    const key = `${level.toLowerCase()}_${cat}`;
    return categoryNames[key]?.() ?? cat;
  }

  type BadgeColor = 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink';

  const badgeColors: Record<BadgeColor, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  };

  // Card left-border accent and heading colour per level
  const cardAccents: Record<BadgeColor, { heading: string }> = {
    green: { heading: 'text-green-700 dark:text-green-400' },
    teal: { heading: 'text-teal-700 dark:text-teal-400' },
    blue: { heading: 'text-blue-700 dark:text-blue-400' },
    indigo: { heading: 'text-indigo-700 dark:text-indigo-400' },
    purple: { heading: 'text-purple-700 dark:text-purple-400' },
    pink: { heading: 'text-pink-700 dark:text-pink-400' }
  };

  const features = [
    { icon: '🧠', label: () => m.home_features_smart(), href: '/guide' },
    { icon: '🔊', label: () => m.home_features_audio(), href: null },
    { icon: '📚', label: () => m.home_features_vocab(), href: null },
    { icon: '🎯', label: () => m.home_features_norskproven(), href: '/norskproven' }
  ];

  // QR code share widget
  let showQr = $state(false);
  const APP_URL = 'https://norskeord.no/';

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Norskeord',
    url: 'https://norskeord.no',
    description:
      'Free Norwegian flashcards from A1 to C2. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation.',
    inLanguage: ['en', 'nb'],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://norskeord.no/{search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const learningResourceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'Norskeord — Norwegian Vocabulary Flashcards',
    description:
      'Flashcard decks covering A1 to C2 Norwegian vocabulary with audio, spaced repetition scheduling, and Norskprøven exam preparation.',
    url: 'https://norskeord.no',
    inLanguage: 'nb',
    educationalLevel: 'A1 to C2 (CEFR)',
    learningResourceType: 'Flashcard',
    teaches: 'Norwegian vocabulary',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: 'Norskeord',
      url: 'https://norskeord.no'
    }
  };

  // Count visible categories per level (excluding uttrykk-preview for plus users)
  function visibleCategoryCount(levelId: string): number {
    const cats = CATEGORIES_BY_LEVEL[levelId as keyof typeof CATEGORIES_BY_LEVEL];
    return cats.filter((cat) => !(isPlus && cat === 'uttrykk-preview')).length;
  }

  // For free users: how many locked categories to collapse into a "+N with Plus" badge.
  // Only collapse when there are 3 or more locked cats (keeps A1/A2 as-is).
  const COLLAPSE_THRESHOLD = 3;

  function lockedCategoryCount(levelId: string): number {
    if (isPlus) return 0;
    const cats = CATEGORIES_BY_LEVEL[levelId as keyof typeof CATEGORIES_BY_LEVEL];
    return cats.filter((cat) => cat !== 'uttrykk-preview' && isPlusCategory(levelId, cat)).length;
  }

  function shouldCollapse(levelId: string): boolean {
    return !isPlus && lockedCategoryCount(levelId) >= COLLAPSE_THRESHOLD;
  }
  const websiteSchemaJson = JSON.stringify(websiteSchema);
  const learningSchemaJson = JSON.stringify(learningResourceSchema);
</script>

<!-- ── Structured data ────────────────────────────────────────────────── -->
<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + websiteSchemaJson + '</scr' + 'ipt>'}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + learningSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<div
  class="relative mt-4 overflow-hidden bg-linear-to-br from-indigo-950 via-blue-900 to-indigo-800 px-4 py-10 text-center sm:mt-8 sm:py-20"
>
  <!-- Decorative blur blobs -->
  <div
    class="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
  ></div>
  <div
    class="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl"
  ></div>

  <div class="relative mx-auto max-w-2xl">
    <div
      class="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-indigo-200 uppercase backdrop-blur-sm"
    >
      {m.home_hero_badge()}
    </div>

    <h1 class="mt-0 mb-4 text-4xl leading-tight font-extrabold text-white sm:text-5xl">
      {m.home_hero_heading()} <span class="text-indigo-300">{m.home_hero_heading_highlight()}</span>
    </h1>

    <p class="mb-6 text-lg leading-relaxed text-indigo-100/80">
      {m.home_hero_body()}
    </p>

    <div class="flex flex-wrap justify-center gap-3">
      {#if !user}
        <a
          href="/auth/login"
          class="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-400"
        >
          {m.home_hero_cta_free()}
        </a>
        <a
          href="/plus"
          class="rounded-xl border border-indigo-200/25 px-6 py-3 text-sm font-medium text-indigo-200/80 transition hover:border-indigo-200/50 hover:text-white"
        >
          {m.home_hero_cta_plus()}
        </a>
      {/if}
    </div>

    {#if !user}
      <p class="mt-3 text-xs text-indigo-300/50">{m.home_hero_no_cc()}</p>
    {/if}

    <!-- Share / QR toggle -->
    <div class="mt-6 flex justify-center">
      <button
        type="button"
        onclick={() => (showQr = !showQr)}
        class="inline-flex items-center gap-1.5 rounded-full border border-indigo-300/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur-sm transition hover:bg-white/20"
      >
        {showQr ? m.home_hero_hide_qr() : m.home_hero_share()}
      </button>
    </div>

    {#if showQr}
      <div class="mt-4 flex flex-col items-center gap-2">
        <div class="rounded-xl bg-white p-3 shadow-lg">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={encodeURIComponent(
              APP_URL
            )}"
            alt={m.home_hero_qr_alt()}
            width="160"
            height="160"
            class="block"
          />
        </div>
        <p class="text-xs text-indigo-200/70">
          {m.home_hero_qr_body({ site: 'norskeord.no' })}
        </p>
      </div>
    {/if}
  </div>
</div>

<!-- ── Social proof / feature strip ────────────────────────────────────── -->
<div
  class="relative mb-12 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-rose-700"
>
  <div
    class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5"
  >
    {#each features as f (f.icon)}
      <span class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        <span class="text-lg">{f.icon}</span>
        {#if f.href}
          <a href={f.href} class="hover:underline">{f.label()}</a>
        {:else}
          {f.label()}
        {/if}
      </span>
    {/each}
  </div>
</div>

<!-- ── Deck picker ──────────────────────────────────────────────────────── -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
  {#each levels as level (level.id)}
    {@const categories = CATEGORIES_BY_LEVEL[level.id]}
    {@const badge = badgeColors[level.color]}
    {@const accent = cardAccents[level.color]}
    {@const count = visibleCategoryCount(level.id)}
    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm
             dark:border-white/10 dark:bg-indigo-950/60"
    >
      <!-- Card header -->
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold {accent.heading}">{level.label()}</h2>
        <span
          class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500
                 dark:bg-gray-700 dark:text-gray-400"
        >
          {count} decks
        </span>
      </div>

      <!-- Category pills -->
      <div class="flex flex-wrap gap-2">
        {#each categories as cat (cat)}
          {#if !(isPlus && cat === 'uttrykk-preview')}
            {@const locked = !isPlus && isPlusCategory(level.id, cat)}
            {#if locked && shouldCollapse(level.id)}
              <!-- skip: will be shown as a single +N badge below -->
            {:else}
              <a
                href={locked ? '/plus' : `/${level.id.toLowerCase()}/${cat}`}
                class="{badge} rounded-full px-3 py-0.5 text-sm font-medium transition-opacity hover:opacity-75
                       {locked ? 'cursor-default opacity-60' : ''}"
                title={locked ? m.plus_category_locked() : undefined}
              >
                {locked ? '🔒 ' : ''}{getCategoryName(level.id, cat)}
              </a>
            {/if}
          {/if}
        {/each}
        {#if shouldCollapse(level.id)}
          <a
            href="/plus"
            class="rounded-full border border-indigo-300 bg-indigo-50 px-3 py-0.5 text-sm font-medium text-indigo-600 transition-opacity hover:opacity-75 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          >
            +{lockedCategoryCount(level.id)} with Plus →
          </a>
        {/if}
      </div>
    </div>
  {/each}
</div>
