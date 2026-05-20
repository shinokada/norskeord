import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { VocabEntry } from '$lib/types';
import { isPlusCategory } from '$lib/types';
import type { MetaProps } from 'runes-meta-tags';
import { removeHyphensAndCapitalize } from '$lib/utils';

// ---------------------------------------------------------------------------
// Vocab loaders — imported server-side so the JSON is never bundled into the
// client chunk. Dynamic import() works fine in a +page.server.ts context.
// ---------------------------------------------------------------------------

const vocabLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  a1: () => import('$lib/data/vocab-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  a2: () => import('$lib/data/vocab-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b1: () => import('$lib/data/vocab-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b2: () => import('$lib/data/vocab-b2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  c1: () => import('$lib/data/vocab-c1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  c2: () => import('$lib/data/vocab-c2.json') as unknown as Promise<{ default: VocabEntry[] }>
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

const OG_BASE_URL = 'https://open-graph-vercel.vercel.app/api/norskeord';

// ---------------------------------------------------------------------------
// Server load — runs on every request; HTML is pre-rendered for Google.
// locals.plan is set by hooks.server.ts before this runs.
// ---------------------------------------------------------------------------

export const load: PageServerLoad = async ({ params, locals }) => {
  const { level, category } = params;
  const isPlus = locals.plan === 'plus';

  // Gate: redirect free users who try to open a Plus-only category directly
  if (!isPlus && isPlusCategory(level, category)) {
    redirect(302, '/plus?ref=category-lock');
  }

  const key = `${level.toLowerCase()}/${category}`;
  const levelUpper = level.toUpperCase();
  const categoryName = removeHyphensAndCapitalize(category);

  // Build shared meta
  const ogImage = `${OG_BASE_URL}?title=${encodeURIComponent(categoryName)}&level=${encodeURIComponent(levelUpper)}`;
  const pageTitle = `Norwegian ${levelUpper} ${categoryName} Vocabulary — Norskeord`;
  const pageDescription = `Learn Norwegian ${categoryName} words with audio flashcards at ${levelUpper} level. Free on Norskeord.`;

  const pageMetaTags: MetaProps = {
    title: pageTitle,
    description: pageDescription,
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

  // uttrykk-preview: Plus users are silently redirected to the full deck
  if (category === 'uttrykk-preview') {
    if (isPlus) {
      const fullKey = `${level.toLowerCase()}/uttrykk`;
      const fullLoader = uttrykkLoaders[fullKey];
      if (fullLoader) {
        const data = await fullLoader();
        return { entries: data.default, level: levelUpper, category: 'uttrykk', pageMetaTags };
      }
    }
    const previewLoader = uttrykkPreviewLoaders[key];
    if (previewLoader) {
      const data = await previewLoader();
      return { entries: data.default, level: levelUpper, category, pageMetaTags };
    }
  }

  // Full uttrykk deck (Plus only — already gated above)
  const uttrykkLoader = uttrykkLoaders[key];
  if (uttrykkLoader) {
    const data = await uttrykkLoader();
    return { entries: data.default, level: levelUpper, category, pageMetaTags };
  }

  // Regular vocab categories — filter by category from the level's full JSON
  const loader = vocabLoaders[level.toLowerCase()];
  if (!loader) {
    return { entries: [] as VocabEntry[], level: levelUpper, category, pageMetaTags };
  }

  const vocab = await loader();
  const entries = vocab.default.filter((e) => e.category === category);
  return { entries, level: levelUpper, category, pageMetaTags };
};
