import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { VocabEntry } from '$lib/types';
import { isPlusCategory } from '$lib/types';

export const ssr = false;

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

// Preview decks — free users only (10 entries each)
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

export const load: PageLoad = async ({ params, parent }) => {
  const { level, category } = params;
  const { plan } = await parent();
  const isPlus = plan === 'plus';

  // Gate: redirect free users who try to access a Plus-only category directly
  if (!isPlus && isPlusCategory(level, category)) {
    redirect(302, '/plus?ref=category-lock');
  }

  const key = `${level.toLowerCase()}/${category}`;

  // uttrykk-preview: Plus users are silently redirected to the full deck
  if (category === 'uttrykk-preview') {
    if (isPlus) {
      const fullKey = `${level.toLowerCase()}/uttrykk`;
      const fullLoader = uttrykkLoaders[fullKey];
      if (fullLoader) {
        const data = await fullLoader();
        return { entries: data.default, level: level.toUpperCase(), category: 'uttrykk' };
      }
    }
    const previewLoader = uttrykkPreviewLoaders[key];
    if (previewLoader) {
      const data = await previewLoader();
      return { entries: data.default, level: level.toUpperCase(), category };
    }
  }

  // Full uttrykk deck (Plus only — already gated above)
  const uttrykkLoader = uttrykkLoaders[key];
  if (uttrykkLoader) {
    const data = await uttrykkLoader();
    return { entries: data.default, level: level.toUpperCase(), category };
  }

  // Regular vocab categories
  const loader = vocabLoaders[level.toLowerCase()];
  if (!loader) {
    return { entries: [] as VocabEntry[], level: level.toUpperCase(), category };
  }

  const vocab = await loader();
  const entries = vocab.default.filter((e) => e.category === category);
  return { entries, level: level.toUpperCase(), category };
};
