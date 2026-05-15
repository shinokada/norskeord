<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { CATEGORIES_BY_LEVEL, isPlusCategory } from '$lib/types';
  import { validFlashcardPathPattern } from '$lib/utils';
  import * as m from '$lib/paraglide/messages.js';

  // Only auto-redirect on direct/fresh page loads (from === null),
  // not when the user explicitly navigates home via an in-app link.
  afterNavigate(async ({ from }) => {
    if (from !== null) return;
    const last = localStorage.getItem('last-flashcard-path');
    if (last && validFlashcardPathPattern.test(last)) {
      try {
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        await goto(last, { replaceState: true });
      } catch {
        localStorage.removeItem('last-flashcard-path');
      }
    } else if (last) {
      localStorage.removeItem('last-flashcard-path');
    }
  });

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
    'a1_basic-adjectives': m['category_a1_basic-adjectives'],
    'a1_basic-verbs': m['category_a1_basic-verbs'],
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
    'a2_health-basic': m['category_a2_health-basic'],
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
    'c2_nuanced-distinctions': m['category_c2_nuanced-distinctions'],
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

  const features = [
    { icon: '🧠', label: 'Smart scheduling', href: '/about' },
    { icon: '🔊', label: 'Audio on every card', href: null },
    { icon: '📚', label: 'A1–C2 vocabulary', href: null },
    { icon: '🎯', label: 'Norskprøven prep', href: '/norskproven' }
  ];
</script>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<div
  class="relative -mx-4 mt-8 overflow-hidden bg-linear-to-br from-indigo-950 via-blue-900 to-indigo-800 px-4 py-20 text-center"
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
      Norwegian vocabulary and phrase
    </div>

    <h1 class="mt-0 mb-4 text-4xl leading-tight font-extrabold text-white sm:text-5xl">
      Learn Norwegian vocabulary/phrase that <span class="text-indigo-300">actually sticks</span>
    </h1>

    <p class="mb-6 text-lg leading-relaxed text-indigo-100/80">
      Flashcards built for Norskprøven candidates, new immigrants, and serious learners. Smart
      scheduling shows you the right word at the right time — so nothing slips through the cracks.
    </p>

    <div class="flex flex-wrap justify-center gap-3">
      <a
        href="#deck-picker"
        class="rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-900 shadow-lg transition hover:bg-indigo-50"
      >
        Browse decks →
      </a>
      <a
        href="/norskproven"
        class="rounded-xl border border-indigo-300/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
      >
        Norskprøven prep
      </a>
    </div>
  </div>
</div>

<!-- ── Social proof / feature strip ────────────────────────────────────── -->
<div
  class="relative -mx-4 mb-12 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60"
>
  <div
    class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5"
  >
    {#each features as f (f.label)}
      <span class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        <span class="text-lg">{f.icon}</span>
        {#if f.href}
          <a href={f.href} class="hover:underline">{f.label}</a>
        {:else}
          {f.label}
        {/if}
      </span>
    {/each}
  </div>
</div>

<!-- ── Deck picker ──────────────────────────────────────────────────────── -->
<div id="deck-picker" class="scroll-mt-20 space-y-10 text-left">
  {#each levels as level (level.id)}
    {@const categories = CATEGORIES_BY_LEVEL[level.id]}
    {@const badge = badgeColors[level.color]}
    <div>
      <h2 class="mb-3 text-xl font-semibold dark:text-white">{level.label()}</h2>
      <div class="flex flex-wrap gap-2">
        {#each categories as cat (cat)}
          {#if !(isPlus && cat === 'uttrykk-preview')}
            {@const locked = !isPlus && isPlusCategory(level.id, cat)}
            <a
              href={locked ? '/plus?ref=category-lock' : `/${level.id.toLowerCase()}/${cat}`}
              class="{badge} rounded-full px-4 py-0.5 font-medium transition-opacity hover:opacity-75
                     {locked ? 'cursor-default opacity-60' : ''}"
              title={locked ? m.plus_category_locked() : undefined}
            >
              {locked ? '🔒 ' : ''}{getCategoryName(level.id, cat)}
            </a>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>
