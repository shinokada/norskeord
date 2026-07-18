import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { VocabEntry } from '$lib/types';
import { CATEGORIES_BY_LEVEL } from '$lib/config';
import { isPlusCategory } from '$lib/access';
import type { CEFRLevel } from '$lib/types';
import type { MetaProps } from 'runes-meta-tags';
import { removeHyphensAndCapitalize } from '$lib/utils';
import { partitionUttrykkThemes, UTTRYKK_OTHERS_THEME } from '$lib/vocab-helpers';

// ---------------------------------------------------------------------------
// Vocab loaders — imported server-side so the JSON is never bundled into the
// client chunk. Dynamic import() works fine in a +page.server.ts context.
// ---------------------------------------------------------------------------

const vocabLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  a1: () => import('$lib/data/vocab-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  a2: () => import('$lib/data/vocab-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b1: () => import('$lib/data/vocab-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b2: () => import('$lib/data/vocab-b2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  // C1/C2 were merged into a single combined deck — see vocab-c.json
  c: () => import('$lib/data/vocab-c.json') as unknown as Promise<{ default: VocabEntry[] }>
};

// Full uttrykk decks — Plus users only
const uttrykkLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  'a1/uttrykk': () =>
    import('$lib/data/uttrykk-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'a2/uttrykk': () =>
    import('$lib/data/uttrykk-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'b1/uttrykk': () =>
    import('$lib/data/uttrykk-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'b2/uttrykk': () =>
    import('$lib/data/uttrykk-b2.json') as unknown as Promise<{ default: VocabEntry[] }>
};

// C-level uttrykk — fixed expressions/idioms, each tagged with a real C
// category slug (see ai-docs/implementation/uttrykk-category.md Phase 4).
// Unlike A1–B2, C has no separate "uttrykk" route/gate — these are merged
// in at read time alongside the matching vocab-c category below, rather
// than being folded into vocab-c.json itself (that would misclassify
// idioms as vocab lemmas — see data-rules/vocab-and-uttrykk.md).
const uttrykkCLoader = () =>
  import('$lib/data/uttrykk-c.json') as unknown as Promise<{ default: VocabEntry[] }>;

// Preview decks — free users (10 entries each)
const uttrykkPreviewLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  'a1/uttrykk-preview': () =>
    import('$lib/data/uttrykk-a1-preview.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'a2/uttrykk-preview': () =>
    import('$lib/data/uttrykk-a2-preview.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'b1/uttrykk-preview': () =>
    import('$lib/data/uttrykk-b1-preview.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'b2/uttrykk-preview': () =>
    import('$lib/data/uttrykk-b2-preview.json') as unknown as Promise<{ default: VocabEntry[] }>
};

// ---------------------------------------------------------------------------
// Server load — runs on every request; HTML is pre-rendered for Google.
// locals.plan is set by hooks.server.ts before this runs.
// ---------------------------------------------------------------------------

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { level, category } = params;
  const isPlus = locals.plan === 'plus';

  // Redirect old c1/c2 category URLs to the combined /c/ route
  if (level === 'c1' || level === 'c2') {
    redirect(301, `/c/${category}`);
  }

  // Gate: redirect free users who try to open a Plus-only category directly
  if (!isPlus && isPlusCategory(level, category)) {
    redirect(302, '/plus?ref=category-lock');
  }

  const key = `${level.toLowerCase()}/${category}`;
  const levelUpper = level.toUpperCase() as CEFRLevel;
  const categoryName = removeHyphensAndCapitalize(category);

  // ── Prev / Next category navigation ────────────────────────────────────────
  // Build the visible category list for this level: exclude uttrykk-preview
  // for Plus users (they get the full uttrykk deck instead).
  const allCats: string[] = [...(CATEGORIES_BY_LEVEL[levelUpper] ?? [])];
  const visibleCats: string[] = isPlus
    ? allCats.filter((c) => c !== 'uttrykk-preview')
    : allCats.filter((c) => c !== 'uttrykk' && !isPlusCategory(level, c));

  // Resolve the effective category slug (uttrykk-preview → uttrykk for Plus)
  const effectiveCategory = isPlus && category === 'uttrykk-preview' ? 'uttrykk' : category;

  const idx = visibleCats.indexOf(effectiveCategory);
  const prevSlug = idx > 0 ? visibleCats[idx - 1] : null;
  const nextSlug = idx !== -1 && idx < visibleCats.length - 1 ? visibleCats[idx + 1] : null;

  const prevCategory = prevSlug
    ? {
        slug: prevSlug,
        label: removeHyphensAndCapitalize(prevSlug),
        href: `/${level.toLowerCase()}/${prevSlug}`
      }
    : null;
  const nextCategory = nextSlug
    ? {
        slug: nextSlug,
        label: removeHyphensAndCapitalize(nextSlug),
        href: `/${level.toLowerCase()}/${nextSlug}`
      }
    : null;

  // When a free user reaches the end of the free list (uttrykk-preview), show
  // a Plus badge for the level's locked categories instead of hiding the arrow.
  const nextLocked =
    !isPlus && !nextCategory
      ? (() => {
          const lockedCount = allCats.filter((c) => isPlusCategory(level, c)).length;
          return lockedCount > 0
            ? { count: lockedCount, href: '/plus?ref=flashcard-nav-end' }
            : null;
        })()
      : null;

  // Build shared meta
  const ogImage = `https://norskeord.no/og/deck/${level.toLowerCase()}/${category}.png`;
  const pageTitle = `Norwegian ${levelUpper} ${categoryName} Vocabulary — Norskeord`;
  // C is the combined C1/C2 "Mastery" level — keep its distinct SEO copy
  const pageDescription =
    levelUpper === 'C'
      ? `Learn Norwegian ${categoryName} words at C (Mastery) level. Free on Norskeord.`
      : `Learn Norwegian ${categoryName} words with audio flashcards at ${levelUpper} level. Free on Norskeord.`;

  const learningResourceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: pageTitle,
    description: pageDescription,
    educationalLevel: levelUpper,
    inLanguage: 'nb',
    learningResourceType: 'Flashcards',
    url: `https://norskeord.no/${level.toLowerCase()}/${category}`,
    image: ogImage,
    provider: {
      '@type': 'Organization',
      name: 'Norskeord',
      url: 'https://norskeord.no'
    }
  };

  // C isn't part of the Norskprøven exam, so it gets its own keyword set
  // instead of the "Norskprøven {level}" term used for A1–B2.
  const pageKeywords = (
    levelUpper === 'C'
      ? [
          `Norwegian C vocabulary`,
          `Norwegian ${categoryName} words`,
          `learn Norwegian ${categoryName}`,
          `${categoryName} Norwegian flashcards`,
          `C Norwegian`,
          `advanced Norwegian vocabulary`,
          `Norwegian ${category}`
        ]
      : [
          `Norwegian ${levelUpper} vocabulary`,
          `Norwegian ${categoryName} words`,
          `learn Norwegian ${categoryName}`,
          `${categoryName} Norwegian flashcards`,
          `${levelUpper} Norwegian`,
          `Norskprøven ${levelUpper}`,
          `Norwegian ${category}`
        ]
  ).join(', ');

  const pageMetaTags: MetaProps = {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    og: {
      title: pageTitle,
      description: pageDescription,
      image: ogImage,
      imageWidth: '1200',
      imageHeight: '630',
      imageAlt: `${categoryName} — ${levelUpper} Norwegian vocabulary`
    },
    twitter: {
      title: pageTitle,
      description: pageDescription,
      image: ogImage,
      imageAlt: `${categoryName} — ${levelUpper} Norwegian vocabulary`
    }
  };

  // Phase 3 (ai-docs/implementation/uttrykk-category.md): group the full
  // uttrykk deck by `theme` and support an optional ?theme= pre-filter.
  // A1–B2 only — C's uttrykk entries have no `theme` field (they carry a
  // real category slug instead and are merged in via uttrykkCLoader below),
  // so this just yields an empty `themes` array for C, which the client
  // treats as "no breakdown to show".
  function groupByTheme(all: VocabEntry[]) {
    const counts = new Map<string, number>();
    for (const e of all) {
      if (e.theme) counts.set(e.theme, (counts.get(e.theme) ?? 0) + 1);
    }
    const themes = [...counts.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    const requested = url.searchParams.get('theme');

    // Hub links to "Others" for any theme under UTTRYKK_OTHERS_THRESHOLD
    // (see partitionUttrykkThemes) rather than a real theme slug — match
    // entries against the same minor-theme set the hub used to build that
    // chip, so the two stay in sync.
    if (requested === UTTRYKK_OTHERS_THEME) {
      const { minor } = partitionUttrykkThemes(themes);
      if (minor.length > 0) {
        const minorNames = new Set(minor.map((t) => t.theme));
        const entries = all.filter((e) => e.theme && minorNames.has(e.theme));
        return { entries, themes, selectedTheme: UTTRYKK_OTHERS_THEME };
      }
      // No minor themes for this level — fall through to "no filter" below.
    }

    const selectedTheme = requested && counts.has(requested) ? requested : null;
    const entries = selectedTheme ? all.filter((e) => e.theme === selectedTheme) : all;
    return { entries, themes, selectedTheme };
  }

  // uttrykk-preview: Plus users are silently redirected to the full deck.
  // The preview stays a flat 10-item teaser — no theme breakdown here.
  if (category === 'uttrykk-preview') {
    if (isPlus) {
      const fullKey = `${level.toLowerCase()}/uttrykk`;
      const fullLoader = uttrykkLoaders[fullKey];
      if (fullLoader) {
        const data = await fullLoader();
        const { entries, themes, selectedTheme } = groupByTheme(data.default);
        return {
          entries,
          level: levelUpper,
          category: 'uttrykk',
          themes,
          selectedTheme,
          prevCategory,
          nextCategory,
          pageMetaTags,
          learningResourceSchema
        };
      }
    }
    const previewLoader = uttrykkPreviewLoaders[key];
    if (previewLoader) {
      const data = await previewLoader();
      return {
        entries: data.default,
        level: levelUpper,
        category,
        themes: [] as { theme: string; count: number }[],
        selectedTheme: null as string | null,
        prevCategory,
        nextCategory,
        nextLocked,
        pageMetaTags,
        learningResourceSchema
      };
    }
  }

  // Full uttrykk deck (Plus only — already gated above)
  const uttrykkLoader = uttrykkLoaders[key];
  if (uttrykkLoader) {
    const data = await uttrykkLoader();
    const { entries, themes, selectedTheme } = groupByTheme(data.default);
    return {
      entries,
      level: levelUpper,
      category,
      themes,
      selectedTheme,
      prevCategory,
      nextCategory,
      pageMetaTags,
      learningResourceSchema
    };
  }

  // Regular vocab categories — filter by category from the level's full JSON
  const loader = vocabLoaders[level.toLowerCase()];
  if (!loader) {
    return {
      entries: [] as VocabEntry[],
      level: levelUpper,
      category,
      themes: [] as { theme: string; count: number }[],
      selectedTheme: null as string | null,
      prevCategory,
      nextCategory,
      nextLocked,
      pageMetaTags,
      learningResourceSchema
    };
  }

  const vocab = await loader();
  let entries = vocab.default.filter((e) => e.category === category);

  // C has no separate uttrykk route (see uttrykkCLoader above) — merge in
  // any uttrykk-c.json entries tagged with this category so they appear
  // alongside regular vocab entries for the same topic.
  if (level.toLowerCase() === 'c') {
    const uttrykkC = await uttrykkCLoader();
    const uttrykkEntries = uttrykkC.default.filter((e) => e.category === category);
    entries = [...entries, ...uttrykkEntries];
  }

  return {
    entries,
    level: levelUpper,
    category,
    themes: [] as { theme: string; count: number }[],
    selectedTheme: null as string | null,
    prevCategory,
    nextCategory,
    nextLocked,
    pageMetaTags,
    learningResourceSchema
  };
};
