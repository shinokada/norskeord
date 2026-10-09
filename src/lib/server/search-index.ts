/**
 * search-index.ts (server only)
 *
 * In-memory search index for /api/search, built from the private data
 * submodule on the first request and cached for the life of the server
 * instance. Nothing is written to disk and no index file is served, so the
 * full vocab/uttrykk data is never one download away
 * (ai-docs/implementation/search-index-gate.md).
 *
 * Replaces scripts/build-search-index.ts, which wrote a public
 * static/data/search-index.json.
 */

import type { SearchEntry } from '$lib/search';

export type SearchSource = 'vocab' | 'uttrykk';

export interface SourceRows {
  source: SearchSource;
  rows: Record<string, unknown>[];
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/**
 * Pure mapping from raw data rows to SearchEntry[]. Kept separate from the
 * loader so it can be unit-tested without the data submodule.
 * `id` is a positional key unique within one build; the stable id is `entryId`.
 */
export function buildSearchEntries(files: SourceRows[]): SearchEntry[] {
  const index: SearchEntry[] = [];

  for (const { source, rows } of files) {
    for (const e of rows) {
      const level = str(e.level) ?? '';
      const category = str(e.category) ?? '';
      const norsk = str(e.norsk) ?? '';
      index.push({
        id: `${source}-${level.toLowerCase()}-${String(index.length).padStart(5, '0')}`,
        entryId: str(e.id),
        sense: str(e.sense),
        norsk,
        lemma: str(e.lemma) ?? norsk,
        english: str(e.english) ?? '',
        spanish: str(e.spanish),
        ukrainian: str(e.ukrainian),
        german: str(e.german),
        example: str(e.example) ?? '',
        example_english: str(e.example_english) ?? '',
        example_spanish: str(e.example_spanish),
        example_ukrainian: str(e.example_ukrainian),
        example_german: str(e.example_german),
        definition: str(e.definition),
        level,
        category,
        part: str(e.part),
        source,
        href: `/${level.toLowerCase()}/${category}`
      });
    }
  }

  return index;
}

// Same dynamic-import pattern as /api/review-entries: the JSON stays in the
// server bundle and out of every client chunk.
type Loader = () => Promise<{ default: unknown }>;

const SOURCES: { file: string; source: SearchSource; load: Loader }[] = [
  { file: 'vocab-a1.json', source: 'vocab', load: () => import('$lib/data/vocab-a1.json') },
  { file: 'vocab-a2.json', source: 'vocab', load: () => import('$lib/data/vocab-a2.json') },
  { file: 'vocab-b1.json', source: 'vocab', load: () => import('$lib/data/vocab-b1.json') },
  { file: 'vocab-b2.json', source: 'vocab', load: () => import('$lib/data/vocab-b2.json') },
  { file: 'vocab-c.json', source: 'vocab', load: () => import('$lib/data/vocab-c.json') },
  { file: 'uttrykk-a1.json', source: 'uttrykk', load: () => import('$lib/data/uttrykk-a1.json') },
  { file: 'uttrykk-a2.json', source: 'uttrykk', load: () => import('$lib/data/uttrykk-a2.json') },
  { file: 'uttrykk-b1.json', source: 'uttrykk', load: () => import('$lib/data/uttrykk-b1.json') },
  { file: 'uttrykk-b2.json', source: 'uttrykk', load: () => import('$lib/data/uttrykk-b2.json') },
  { file: 'uttrykk-c.json', source: 'uttrykk', load: () => import('$lib/data/uttrykk-c.json') },
  {
    file: 'norske_metaforiske_uttrykk_B1_B2.json',
    source: 'uttrykk',
    load: () => import('$lib/data/norske_metaforiske_uttrykk_B1_B2.json')
  }
];

async function loadAll(): Promise<SearchEntry[]> {
  const files: SourceRows[] = [];
  for (const { file, source, load } of SOURCES) {
    try {
      const mod = await load();
      if (Array.isArray(mod.default)) {
        files.push({ source, rows: mod.default as Record<string, unknown>[] });
      }
    } catch (err) {
      console.error(`[search-index] could not load ${file}:`, (err as Error).message);
    }
  }
  return buildSearchEntries(files);
}

let indexPromise: Promise<SearchEntry[]> | null = null;

/** Builds the index on first use; later calls reuse the same promise. */
export function getSearchIndex(): Promise<SearchEntry[]> {
  indexPromise ??= loadAll().catch((err) => {
    indexPromise = null; // allow a retry on the next request
    throw err;
  });
  return indexPromise;
}
