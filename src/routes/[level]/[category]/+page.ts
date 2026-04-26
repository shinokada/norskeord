import type { PageLoad } from './$types';
export const ssr = false;
import type { VocabEntry } from '$lib/types';

const vocabLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  a1: () => import('$lib/data/vocab-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  a2: () => import('$lib/data/vocab-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b1: () => import('$lib/data/vocab-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b2: () => import('$lib/data/vocab-b2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  c1: () => import('$lib/data/vocab-c1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  c2: () => import('$lib/data/vocab-c2.json') as unknown as Promise<{ default: VocabEntry[] }>
};

export const load: PageLoad = async ({ params }) => {
  const { level, category } = params;
  const loader = vocabLoaders[level.toLowerCase()];

  if (!loader) {
    return { entries: [] as VocabEntry[], level: level.toUpperCase(), category };
  }

  const vocab = await loader();
  const entries = vocab.default.filter((e) => e.category === category);

  return { entries, level: level.toUpperCase(), category };
};
