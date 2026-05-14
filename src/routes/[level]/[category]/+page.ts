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

// Uttrykk (phrase) data loaders keyed by "level/category"
const uttrykklLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  'b2/uttrykk': () =>
    import('$lib/data/uttrykk-b2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'b2/uttrykk-preview': () =>
    import('$lib/data/uttrykk-b2-preview.json') as unknown as Promise<{ default: VocabEntry[] }>
};

export const load: PageLoad = async ({ params, parent }) => {
  const { level, category } = params;

  // Gate: redirect free users who try to access a Plus-only category directly
  const { plan } = await parent();
  if (plan !== 'plus' && isPlusCategory(level, category)) {
    redirect(302, '/plus?ref=category-lock');
  }

  // Check uttrykk loaders first (they are keyed by "level/category")
  const uttrykkKey = `${level.toLowerCase()}/${category}`;
  const uttrykkLoader = uttrykklLoaders[uttrykkKey];
  if (uttrykkLoader) {
    const data = await uttrykkLoader();
    return { entries: data.default, level: level.toUpperCase(), category };
  }

  const loader = vocabLoaders[level.toLowerCase()];

  if (!loader) {
    return { entries: [] as VocabEntry[], level: level.toUpperCase(), category };
  }

  const vocab = await loader();
  const entries = vocab.default.filter((e) => e.category === category);

  return { entries, level: level.toUpperCase(), category };
};
