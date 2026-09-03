/**
 * POST /api/review-entries
 *
 * ai-docs/implementation/due-only.md — Step 1.
 *
 * Resolves a list of vocab_ids (+ the CEFR level each one belongs to) back
 * into full VocabEntry objects, without shipping an entire level's JSON to
 * the client just to filter it. Used by the /review due-only session: the
 * client already knows which ids are due (from the progress map — Plus via
 * Supabase, free/guest via localStorage) but only has id/level/category on
 * each CardProgress row, not the full entry (norsk, translations,
 * examples, ...).
 *
 * No auth check — this returns the same public vocab/uttrykk data every
 * `/{level}/{category}` page already serves, just addressed by id instead
 * of by category.
 */

import type { RequestHandler } from './$types';
import type { VocabEntry, CEFRLevel } from '$lib/types';

interface ReviewEntryRequest {
  id: string;
  level: CEFRLevel;
}

// Same loader shape as `/{level}/{category}/+page.server.ts` — dynamic
// import() keeps these out of the client bundle; only the files a given
// request's levels actually touch get loaded.
const vocabLoaders: Record<CEFRLevel, () => Promise<{ default: VocabEntry[] }>> = {
  A1: () => import('$lib/data/vocab-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  A2: () => import('$lib/data/vocab-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  B1: () => import('$lib/data/vocab-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  B2: () => import('$lib/data/vocab-b2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  C: () => import('$lib/data/vocab-c.json') as unknown as Promise<{ default: VocabEntry[] }>
};

// A1–B2 uttrykk decks. C has no separate uttrykk file keyed by level — see
// uttrykkCLoader below.
const uttrykkLoaders: Partial<Record<CEFRLevel, () => Promise<{ default: VocabEntry[] }>>> = {
  A1: () => import('$lib/data/uttrykk-a1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  A2: () => import('$lib/data/uttrykk-a2.json') as unknown as Promise<{ default: VocabEntry[] }>,
  B1: () => import('$lib/data/uttrykk-b1.json') as unknown as Promise<{ default: VocabEntry[] }>,
  B2: () => import('$lib/data/uttrykk-b2.json') as unknown as Promise<{ default: VocabEntry[] }>
};

const uttrykkCLoader = () =>
  import('$lib/data/uttrykk-c.json') as unknown as Promise<{ default: VocabEntry[] }>;

// Sanity guard against a pathological payload — a real review session is
// bounded by however many cards are actually due, which in practice never
// gets close to this.
const MAX_ITEMS = 1000;

export const POST: RequestHandler = async ({ request }) => {
  let items: ReviewEntryRequest[];
  try {
    const body = await request.json();
    items = Array.isArray(body?.items) ? body.items : [];
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (items.length === 0) {
    return Response.json({ entries: [] });
  }
  if (items.length > MAX_ITEMS) {
    items = items.slice(0, MAX_ITEMS);
  }

  // Group requested ids by level so each JSON file is loaded at most once,
  // regardless of how many due cards came from it.
  const idsByLevel = new Map<CEFRLevel, Set<string>>();
  for (const item of items) {
    if (!item?.id || !item?.level) continue;
    const set = idsByLevel.get(item.level) ?? new Set<string>();
    set.add(item.id);
    idsByLevel.set(item.level, set);
  }

  const resolved: VocabEntry[] = [];

  for (const [level, ids] of idsByLevel) {
    // A given level's due ids can come from either its vocab file or its
    // uttrykk file (or, for C, uttrykk-c.json) — rather than pre-classifying
    // by id prefix or category sentinel (fragile, easy to drift from the
    // data), just check both files and keep whatever matches. Vocab and
    // uttrykk ids are disjoint in practice, so this never double-resolves
    // the same due card.
    const vocabLoader = vocabLoaders[level];
    if (vocabLoader) {
      const vocab = await vocabLoader();
      for (const e of vocab.default) {
        if (ids.has(e.id)) resolved.push(e);
      }
    }

    if (level === 'C') {
      const uttrykkC = await uttrykkCLoader();
      for (const e of uttrykkC.default) {
        const key = e.id ?? e.norsk;
        if (ids.has(key)) resolved.push(e);
      }
    } else {
      const uttrykkLoader = uttrykkLoaders[level];
      if (uttrykkLoader) {
        const uttrykk = await uttrykkLoader();
        for (const e of uttrykk.default) {
          if (ids.has(e.id)) resolved.push(e);
        }
      }
    }
  }

  return Response.json({ entries: resolved });
};
