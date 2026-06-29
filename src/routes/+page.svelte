<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';
  import stats from '$lib/data/stats.json';

  // Only auto-redirect on direct/fresh page loads (from === null),
  // not when the user explicitly navigates home via an in-app link.
  // Only applies to authenticated users — anonymous visitors always see the homepage.
  afterNavigate(async ({ from, complete }) => {
    if (from === null && page.data.user) {
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

  import { validFlashcardPathPattern } from '$lib/utils';

  let user = $derived(page.data.user);

  const levels = [
    {
      id: 'A1',
      href: '/learn/a1',
      label: () => m.home_level_a1(),
      shortLabel: () => m.level_hub_beginner(),
      color: 'green'
    },
    {
      id: 'A2',
      href: '/learn/a2',
      label: () => m.home_level_a2(),
      shortLabel: () => m.level_hub_elementary(),
      color: 'teal'
    },
    {
      id: 'B1',
      href: '/learn/b1',
      label: () => m.home_level_b1(),
      shortLabel: () => m.level_hub_intermediate(),
      color: 'blue'
    },
    {
      id: 'B2',
      href: '/learn/b2',
      label: () => m.home_level_b2(),
      shortLabel: () => m.level_hub_upper_intermediate(),
      color: 'indigo'
    },
    {
      id: 'C',
      href: '/learn/c',
      label: () => m.home_level_c(),
      shortLabel: () => m.level_hub_mastery(),
      color: 'purple'
    }
  ] as const;

  type BadgeColor = 'green' | 'teal' | 'blue' | 'indigo' | 'purple';

  const cardAccents: Record<BadgeColor, { heading: string; border: string; link: string }> = {
    green: {
      heading: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800/40',
      link: 'text-green-700 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
    },
    teal: {
      heading: 'text-teal-700 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/40',
      link: 'text-teal-700 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300'
    },
    blue: {
      heading: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/40',
      link: 'text-blue-700 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
    },
    indigo: {
      heading: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/40',
      link: 'text-indigo-700 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300'
    },
    purple: {
      heading: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800/40',
      link: 'text-purple-700 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300'
    }
  };

  const featureStrip = [
    { icon: '🧠', label: () => m.home_features_smart(), href: '/guide' },
    { icon: '🔊', label: () => m.home_features_audio(), href: null },
    { icon: '🎯', label: () => m.home_features_norskproven(), href: '/norskproven' }
  ];

  // Feature showcase cards
  const featureCards = [
    { icon: '📖', titleFn: () => m.home_features_vocab_title(), href: '/learn/a1' },
    { icon: '🧩', titleFn: () => m.home_features_grammar_title(), href: '/grammar' },
    { icon: '🎯', titleFn: () => m.home_features_quiz_title(), href: '/quiz' },
    { icon: '📝', titleFn: () => m.home_features_norskproven_title(), href: '/norskproven' }
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
      'Free Norwegian flashcards from A1 to C. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation.',
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
      'Flashcard decks covering A1 to C Norwegian vocabulary with audio, spaced repetition scheduling, and Norskprøven exam preparation.',
    url: 'https://norskeord.no',
    inLanguage: 'nb',
    educationalLevel: 'A1 to C (CEFR)',
    learningResourceType: 'Flashcard',
    teaches: 'Norwegian vocabulary',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: 'Norskeord',
      url: 'https://norskeord.no'
    }
  };

  // Entry counts from stats.json
  type LevelStats = { vocab: number; uttrykk: number; total: number };
  const byLevel = stats.byLevel as Record<string, LevelStats>;

  function entryCountLabel(levelId: string): string {
    const s = byLevel[levelId];
    if (!s) return '';
    if (s.uttrykk > 0) {
      return `${s.vocab.toLocaleString()} words · ${s.uttrykk.toLocaleString()} phrases`;
    }
    return `${s.vocab.toLocaleString()} words`;
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
  class="relative mt-4 overflow-hidden bg-linear-to-br from-indigo-950 via-blue-900 to-indigo-800 px-4 py-8 text-center sm:mt-8 sm:py-14"
>
  <!-- Decorative blur blobs -->
  <div
    class="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
  ></div>
  <div
    class="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl"
  ></div>

  <div class="relative mx-auto max-w-2xl">
    <h1 class="mt-0 mb-4 text-4xl leading-tight font-extrabold text-white sm:text-5xl">
      {m.home_hero_heading()} <span class="text-indigo-300">{m.home_hero_heading_highlight()}</span>
    </h1>

    <p class="mb-6 text-lg leading-relaxed text-indigo-100/80">
      Norwegian vocabulary from beginner to advanced, with audio and smart review.
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
      <p class="mt-3 text-sm text-indigo-300/50">{m.home_hero_no_cc()}</p>
    {/if}

    <!-- Share / QR toggle -->
    <div class="mt-6 flex justify-center">
      <button
        type="button"
        onclick={() => (showQr = !showQr)}
        class="inline-flex items-center gap-1.5 rounded-full border border-indigo-300/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-indigo-200 backdrop-blur-sm transition hover:bg-white/20"
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
        <p class="text-sm text-indigo-200/70">
          {m.home_hero_qr_body({ site: 'norskeord.no' })}
        </p>
      </div>
    {/if}
  </div>
</div>

<!-- ── Feature strip ────────────────────────────────────────────────────── -->
<div
  class="relative mb-12 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-indigo-950/60"
>
  <div
    class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5"
  >
    {#each featureStrip as f (f.icon)}
      <span class="flex items-center gap-2 text-base font-medium text-gray-600 dark:text-gray-300">
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

<!-- ── Feature showcase ─────────────────────────────────────────────────── -->
<div class="mb-14">
  <h2 class="mb-6 text-center font-bold dark:text-white">
    {m.home_features_heading()}
  </h2>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {#each featureCards as card (card.href)}
      <a
        href={card.href}
        class="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-indigo-950/60 dark:hover:bg-indigo-950/80"
      >
        <div class="mb-3 text-3xl">{card.icon}</div>
        <h3 class="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {card.titleFn()}
        </h3>
      </a>
    {/each}
  </div>
</div>

<!-- ── Level summary cards ──────────────────────────────────────────────── -->
<div class="mb-12">
  <h2 class="mb-6 text-center font-bold dark:text-white">
    {m.home_levels_heading()}
  </h2>
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {#each levels as lvl (lvl.id)}
      {@const accent = cardAccents[lvl.color]}
      <a
        href={lvl.href}
        class="group flex flex-col rounded-2xl border {accent.border} bg-white p-5 text-left shadow-sm transition hover:shadow-md dark:bg-indigo-950/60"
      >
        <div class="mb-2 flex items-baseline gap-3">
          <span
            class="font-norse font-bold text-3xl leading-none {accent.heading}"
            style="letter-spacing:0.04em">{lvl.id}</span
          >
          <h3 class="font-norse text-xl font-semibold {accent.heading}">{lvl.shortLabel()}</h3>
        </div>
        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          {entryCountLabel(lvl.id)}
        </p>
      </a>
    {/each}
  </div>
</div>
