import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { VocabEntry } from '$lib/types';
import { CATEGORIES_BY_LEVEL } from '$lib/config';
import { isPlusCategory } from '$lib/access';
import type { MetaProps } from 'runes-meta-tags';
import { removeHyphensAndCapitalize } from '$lib/utils';

const vocabLoader = () =>
  import('$lib/data/vocab-c.json') as unknown as Promise<{ default: VocabEntry[] }>;

export const load: PageServerLoad = async ({ params, locals }) => {
  const { category } = params;
  const isPlus = locals.plan === 'plus';
  const level = 'c';
  const levelUpper = 'C';

  // Validate the category belongs to the C level
  const allCats = [...(CATEGORIES_BY_LEVEL['C'] ?? [])];
  if (!allCats.includes(category as (typeof allCats)[number])) {
    throw error(404, `Unknown C-level category: ${category}`);
  }

  // Gate: redirect free users who try to open a Plus-only category directly
  if (!isPlus && isPlusCategory(level, category)) {
    redirect(302, '/plus?ref=category-lock');
  }

  // Load vocab once so we can both filter the current category's entries and
  // skip over categories that have no data yet when building prev/next nav.
  const vocab = await vocabLoader();
  const entries = vocab.default.filter((e) => e.category === category);

  const categoriesWithData = new Set(vocab.default.map((e) => e.category));

  // Prev / Next category navigation — only walk categories that actually have
  // vocab entries (content gaps like an empty 'proverbs' deck are skipped).
  const allCatsWithData = allCats.filter((c) => categoriesWithData.has(c));
  const visibleCats = isPlus
    ? allCatsWithData
    : allCatsWithData.filter((c) => !isPlusCategory(level, c));

  const idx = visibleCats.indexOf(category as (typeof visibleCats)[number]);
  const prevSlug = idx > 0 ? visibleCats[idx - 1] : null;
  const nextSlug = idx !== -1 && idx < visibleCats.length - 1 ? visibleCats[idx + 1] : null;

  const prevCategory = prevSlug
    ? { slug: prevSlug, label: removeHyphensAndCapitalize(prevSlug), href: `/c/${prevSlug}` }
    : null;
  const nextCategory = nextSlug
    ? { slug: nextSlug, label: removeHyphensAndCapitalize(nextSlug), href: `/c/${nextSlug}` }
    : null;

  // When a free user reaches the end of the free list, surface a Plus badge
  // for the remaining locked categories instead of just hiding the arrow.
  // Uses the full configured category list (allCats) — not allCatsWithData —
  // so the count matches /learn/c and stays correct even for categories that
  // don't have vocab data yet.
  const nextLocked =
    !isPlus && !nextCategory
      ? (() => {
          const lockedCount = allCats.filter((c) => isPlusCategory(level, c)).length;
          return lockedCount > 0
            ? { count: lockedCount, href: '/plus?ref=flashcard-nav-end' }
            : null;
        })()
      : null;

  // Meta
  const categoryName = removeHyphensAndCapitalize(category);
  const ogImage = `https://norskeord.no/og/deck/c/${category}.png`;
  const pageTitle = `Norwegian C ${categoryName} Vocabulary — Norskeord`;
  const pageDescription = `Learn Norwegian ${categoryName} words at C (Mastery) level. Free on Norskeord.`;

  const pageKeywords = [
    `Norwegian C vocabulary`,
    `Norwegian ${categoryName} words`,
    `learn Norwegian ${categoryName}`,
    `${categoryName} Norwegian flashcards`,
    `C Norwegian`,
    `advanced Norwegian vocabulary`,
    `Norwegian ${category}`
  ].join(', ');

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
      imageAlt: `${categoryName} — C Norwegian vocabulary`
    },
    twitter: {
      title: pageTitle,
      description: pageDescription,
      image: ogImage,
      imageAlt: `${categoryName} — C Norwegian vocabulary`
    }
  };

  const learningResourceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: pageTitle,
    description: pageDescription,
    educationalLevel: levelUpper,
    inLanguage: 'nb',
    learningResourceType: 'Flashcards',
    url: `https://norskeord.no/c/${category}`,
    image: ogImage,
    provider: {
      '@type': 'Organization',
      name: 'Norskeord',
      url: 'https://norskeord.no'
    }
  };

  return {
    entries,
    level: levelUpper,
    category,
    prevCategory,
    nextCategory,
    nextLocked,
    pageMetaTags,
    learningResourceSchema
  };
};
