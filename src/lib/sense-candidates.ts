/**
 * sense-candidates.ts
 *
 * Pure classification behind scripts/find-sense-candidates.ts (the read-only
 * report of vocab entries that may need splitting into separate senses; see
 * ai-docs/implementation/vocab-multiple-senses.md, Phase 1b). Lives in src/lib
 * so it is unit-tested like everything else. It must stay free of `$lib` imports:
 * the script runs under tsx, which does not resolve that alias.
 *
 * Tiers:
 *   1. Identical `norsk` where not every member has a distinct `sense` (certain).
 *   2. `english` that looks multi-sense: `;`, `/` or `,` outside parentheses
 *      (probable, noisy).
 *   3. Same lemma + same part, different `norsk` (low priority).
 */

export const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'] as const;

export interface SenseEntry {
  id?: string;
  norsk: string;
  lemma?: string;
  english?: string;
  sense?: string;
  level: string;
  category: string;
  part: string;
}

export type Decision = 'split' | 'keep';
export type Review = Record<string, Decision>;

export interface MultiSenseHit {
  entry: SenseEntry;
  count: number;
  sep: ';' | '/' | ',';
}

export interface SenseReport {
  tier1: SenseEntry[][];
  tier2: MultiSenseHit[];
  tier3: SenseEntry[][];
  queued: SenseEntry[];
  unknownReviewIds: string[];
}

/** Same behaviour as bareLemma in quiz.ts (kept local: quiz.ts imports `$lib`). */
export function bareLemma(norsk: string): string {
  return norsk
    .replace(/^å\s+/i, '')
    .replace(/\s*\((en|ei|et)(\s*\/\s*(en|ei|et))*\)\s*$/i, '')
    .trim();
}

const PLURAL_PATTERN = /\s*\((b\.)?pl\.\)$/i;

const norskKey = (e: SenseEntry): string => e.norsk.trim().toLowerCase();
const lemmaKey = (e: SenseEntry): string => (e.lemma ?? bareLemma(e.norsk)).trim().toLowerCase();
const senseKey = (e: SenseEntry): string => (e.sense ?? '').trim().toLowerCase();

export function levelIndex(e: SenseEntry): number {
  return LEVELS.indexOf(e.level.toLowerCase() as (typeof LEVELS)[number]);
}

function groupBy(entries: SenseEntry[], key: (e: SenseEntry) => string): Map<string, SenseEntry[]> {
  const groups = new Map<string, SenseEntry[]>();
  for (const e of entries) {
    const k = key(e);
    if (!k) continue;
    const list = groups.get(k);
    if (list) list.push(e);
    else groups.set(k, [e]);
  }
  return groups;
}

/** Tier 1: identical `norsk` where not every member has a distinct, non-empty `sense`. */
export function findIdenticalNorskGroups(entries: SenseEntry[]): SenseEntry[][] {
  const out: SenseEntry[][] = [];
  for (const group of groupBy(entries, norskKey).values()) {
    if (group.length < 2) continue;
    const senses = group.map(senseKey);
    const distinct = senses.every(Boolean) && new Set(senses).size === group.length;
    if (!distinct) out.push(group);
  }
  return out;
}

/** Tier 2 helper: segment count and strongest separator, ignoring parentheticals. */
export function englishSegments(english: string): { count: number; sep: ';' | '/' | ',' } | null {
  const stripped = english.replace(/\([^)]*\)/g, ' ');
  const sep = stripped.includes(';')
    ? ';'
    : stripped.includes('/')
      ? '/'
      : stripped.includes(',')
        ? ','
        : null;
  if (!sep) return null;
  const count = stripped
    .split(/[;/,]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  return count >= 2 ? { count, sep } : null;
}

const SEP_WEIGHT = { ';': 3, '/': 2, ',': 1 } as const;

/** Tier 3: same lemma + part, at least two distinct `norsk` left after exclusions. */
export function findSameLemmaGroups(entries: SenseEntry[], review: Review): SenseEntry[][] {
  const candidates = entries.filter(
    (e) => !PLURAL_PATTERN.test(e.norsk.trim()) && review[e.id ?? ''] !== 'keep'
  );
  const out: SenseEntry[][] = [];
  for (const group of groupBy(candidates, (e) => `${e.part}|${lemmaKey(e)}`).values()) {
    if (new Set(group.map(norskKey)).size >= 2) out.push(group);
  }
  return out;
}

export function buildReport(entries: SenseEntry[], review: Review): SenseReport {
  const tier1 = findIdenticalNorskGroups(entries);
  const inTier1 = new Set(tier1.flat().map((e) => e.id));

  const tier2: MultiSenseHit[] = [];
  for (const entry of entries) {
    if (entry.sense) continue; // already carries a sense: split or narrowed
    if (entry.id && review[entry.id]) continue; // keep = reviewed; split = shown under "queued"
    if (inTier1.has(entry.id)) continue; // already certain in tier 1
    const seg = englishSegments(entry.english ?? '');
    if (seg) tier2.push({ entry, ...seg });
  }
  tier2.sort(
    (a, b) =>
      b.count - a.count ||
      SEP_WEIGHT[b.sep] - SEP_WEIGHT[a.sep] ||
      (a.entry.id ?? '').localeCompare(b.entry.id ?? '')
  );

  const tier3 = findSameLemmaGroups(entries, review);
  const queued = entries.filter((e) => e.id && review[e.id] === 'split' && !e.sense);

  const knownIds = new Set(entries.map((e) => e.id));
  const unknownReviewIds = Object.keys(review).filter((id) => !knownIds.has(id));

  return { tier1, tier2, tier3, queued, unknownReviewIds };
}
