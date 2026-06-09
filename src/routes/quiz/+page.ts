import type { PageLoad } from './$types';
import type { VocabEntry } from '$lib/types';

export const ssr = false;

// Load all A1–C levels so the distractor pool covers every quiz level.
const vocabLoaders: Record<string, () => Promise<{ default: VocabEntry[] }>> = {
  a1: () => import('$lib/data/vocab-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  a2: () => import('$lib/data/vocab-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b1: () => import('$lib/data/vocab-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  b2: () => import('$lib/data/vocab-b2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  c: () => import('$lib/data/vocab-c.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'uttrykk-a1': () =>
    import('$lib/data/uttrykk-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'uttrykk-a2': () =>
    import('$lib/data/uttrykk-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'uttrykk-b1': () =>
    import('$lib/data/uttrykk-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  'uttrykk-b2': () =>
    import('$lib/data/uttrykk-b2.json') as unknown as Promise<{ default: VocabEntry[] }>
};

export const load: PageLoad = async ({ url, parent }) => {
  const { targetLevel } = await parent();

  // NOTE: the Plus gate is enforced in +page.svelte using page.data.plan, not
  // here. Checking plan in the load function doesn't work reliably for e2e
  // tests because the Playwright __data.json route interceptor only fires on
  // client-side navigations, not on the initial page.goto() server render.
  // Reading plan from page.data inside the component correctly reflects the
  // intercepted value in all cases.

  // Optional ?level= and ?category= query params pre-filter the quiz entries.
  // Both are validated below; unknown values fall back to the full pool.
  const levelParam = url.searchParams.get('level')?.toLowerCase() ?? null;
  const categoryParam = url.searchParams.get('category') ?? null;

  // Validate level param against all known CEFR levels (A1–C).
  const allLevels = ['a1', 'a2', 'b1', 'b2', 'c'];
  const profileLevel = typeof targetLevel === 'string' ? targetLevel.toLowerCase() : null;
  const rawLevel = levelParam ?? profileLevel;
  const validLevel = rawLevel && allLevels.includes(rawLevel) ? rawLevel : null;

  // Load all levels (including uttrykk) in parallel for the distractor pool.
  const loaded = await Promise.all(Object.values(vocabLoaders).map((fn) => fn()));
  const allEntries: VocabEntry[] = loaded.flatMap((m) => m.default);

  // Apply level filter if a valid level was requested.
  let entries = validLevel
    ? allEntries.filter((e) => e.level.toLowerCase() === validLevel)
    : allEntries;

  // Apply category filter on top of the (possibly already filtered) entries.
  if (categoryParam) {
    entries = entries.filter((e) => e.category === categoryParam);
  }

  return {
    entries,
    allEntries,
    // Pass back the validated/normalised params so the page can pre-select
    // the picker without re-reading the URL.
    // `level` reflects the URL param first; falls back to profile target_level.
    level: validLevel,
    category: categoryParam
  };
};
