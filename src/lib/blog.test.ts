import { describe, it, expect } from 'vitest';
import { parsePosts, findPostBySlug, cefrLevels, isPublished, type RawPostModule } from './blog';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMod(
  overrides: Partial<{
    title: string;
    slug: string;
    cefr: string | string[];
    publishedAt: string;
    description: string;
  }> = {}
) {
  return {
    metadata: {
      title: 'Test Post',
      slug: 'test-post',
      cefr: 'A2',
      publishedAt: '2026-01-01',
      description: 'A test post.',
      ...overrides
    },
    default: {} // Svelte component placeholder
  };
}

const TODAY = new Date('2026-05-22');
const YESTERDAY = '2026-05-21';
const TOMORROW = '2026-05-23';

// ── cefrLevels ────────────────────────────────────────────────────────────────

describe('cefrLevels', () => {
  it('wraps a single string in an array', () => {
    expect(cefrLevels('B1')).toEqual(['B1']);
  });

  it('returns an array unchanged', () => {
    expect(cefrLevels(['A1', 'A2', 'B1'])).toEqual(['A1', 'A2', 'B1']);
  });

  it('handles a single-element array', () => {
    expect(cefrLevels(['C2'])).toEqual(['C2']);
  });
});

// ── isPublished ───────────────────────────────────────────────────────────────

describe('isPublished', () => {
  it('returns true for a past date', () => {
    expect(isPublished(YESTERDAY, TODAY)).toBe(true);
  });

  it('returns true for today', () => {
    expect(isPublished('2026-05-22', TODAY)).toBe(true);
  });

  it('returns false for a future date', () => {
    expect(isPublished(TOMORROW, TODAY)).toBe(false);
  });
});

// ── parsePosts ────────────────────────────────────────────────────────────────

describe('parsePosts', () => {
  it('returns an empty array for an empty module map', () => {
    expect(parsePosts({}, TODAY)).toEqual([]);
  });

  it('returns one post for a single valid module', () => {
    const result = parsePosts({ 'a.md': makeMod() }, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test-post');
  });

  it('sorts posts newest-first by publishedAt', () => {
    const modules = {
      'old.md': makeMod({ slug: 'old', publishedAt: '2025-01-01' }),
      'new.md': makeMod({ slug: 'new', publishedAt: '2026-05-01' }),
      'mid.md': makeMod({ slug: 'mid', publishedAt: '2025-06-01' })
    };
    const result = parsePosts(modules, TODAY);
    expect(result[0].slug).toBe('new');
    expect(result[1].slug).toBe('mid');
    expect(result[2].slug).toBe('old');
  });

  it('filters out posts missing a title', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod({ slug: 'valid' }),
      'notitle.md': { metadata: { slug: 'no-title', publishedAt: '2026-01-01' }, default: {} }
    };
    const result = parsePosts(modules, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('valid');
  });

  it('filters out posts missing a slug', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod({ slug: 'valid' }),
      'noslug.md': { metadata: { title: 'No Slug', publishedAt: '2026-01-01' }, default: {} }
    };
    const result = parsePosts(modules, TODAY);
    expect(result).toHaveLength(1);
  });

  it('filters out posts missing publishedAt', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod(),
      'nodate.md': { metadata: { title: 'No Date', slug: 'no-date' }, default: {} }
    };
    const result = parsePosts(modules, TODAY);
    expect(result).toHaveLength(1);
  });

  it('filters out modules with no metadata at all', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod(),
      'bad.md': { default: {} }
    };
    const result = parsePosts(modules, TODAY);
    expect(result).toHaveLength(1);
  });

  it('filters out posts with a future publishedAt', () => {
    const modules = {
      'past.md': makeMod({ slug: 'past', publishedAt: YESTERDAY }),
      'future.md': makeMod({ slug: 'future', publishedAt: TOMORROW })
    };
    const result = parsePosts(modules, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('past');
  });

  it('includes a post published exactly today', () => {
    const modules = {
      'today.md': makeMod({ slug: 'today', publishedAt: '2026-05-22' })
    };
    const result = parsePosts(modules, TODAY);
    expect(result).toHaveLength(1);
  });

  it('preserves a string cefr field', () => {
    const result = parsePosts({ 'a.md': makeMod({ cefr: 'B1' }) }, TODAY);
    expect(result[0].cefr).toBe('B1');
    expect(result[0].description).toBe('A test post.');
  });

  it('preserves an array cefr field', () => {
    const result = parsePosts({ 'a.md': makeMod({ cefr: ['A1', 'A2', 'B1', 'B2'] }) }, TODAY);
    expect(result[0].cefr).toEqual(['A1', 'A2', 'B1', 'B2']);
  });
});

// ── findPostBySlug ────────────────────────────────────────────────────────────

describe('findPostBySlug', () => {
  const modules = {
    'sakte.md': makeMod({ slug: 'sakte-vs-langsomt', title: 'Sakte vs Langsomt' }),
    'denne.md': makeMod({ slug: 'denne-vs-dette', title: 'Denne vs Dette' }),
    'guide.md': makeMod({ slug: 'slik-bruker-du', title: 'Guide', cefr: ['A1', 'A2', 'B1', 'B2'] }),
    'future.md': makeMod({ slug: 'coming-soon', title: 'Coming Soon', publishedAt: TOMORROW })
  };

  it('returns the matching post when slug exists', () => {
    const result = findPostBySlug(modules, 'sakte-vs-langsomt', TODAY);
    expect(result).not.toBeNull();
    expect(result!.meta.title).toBe('Sakte vs Langsomt');
  });

  it('returns null for an unknown slug', () => {
    expect(findPostBySlug(modules, 'does-not-exist', TODAY)).toBeNull();
  });

  it('returns null for an empty module map', () => {
    expect(findPostBySlug({}, 'sakte-vs-langsomt', TODAY)).toBeNull();
  });

  it('returns the content (Svelte component) alongside meta', () => {
    const result = findPostBySlug(modules, 'denne-vs-dette', TODAY);
    expect(result).toHaveProperty('content');
  });

  it('is case-sensitive — slug must match exactly', () => {
    expect(findPostBySlug(modules, 'Sakte-vs-langsomt', TODAY)).toBeNull();
    expect(findPostBySlug(modules, 'SAKTE-VS-LANGSOMT', TODAY)).toBeNull();
  });

  it('matches the second post correctly', () => {
    const result = findPostBySlug(modules, 'denne-vs-dette', TODAY);
    expect(result!.meta.title).toBe('Denne vs Dette');
  });

  it('returns an array cefr for guide posts', () => {
    const result = findPostBySlug(modules, 'slik-bruker-du', TODAY);
    expect(Array.isArray(result!.meta.cefr)).toBe(true);
    expect(result!.meta.cefr).toEqual(['A1', 'A2', 'B1', 'B2']);
  });

  it('returns null for a future post', () => {
    expect(findPostBySlug(modules, 'coming-soon', TODAY)).toBeNull();
  });
});
