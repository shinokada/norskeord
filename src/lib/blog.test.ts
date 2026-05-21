import { describe, it, expect } from 'vitest';
import { parsePosts, findPostBySlug, type RawPostModule } from './blog';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMod(
  overrides: Partial<{
    title: string;
    slug: string;
    cefr: string;
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

// ── parsePosts ────────────────────────────────────────────────────────────────

describe('parsePosts', () => {
  it('returns an empty array for an empty module map', () => {
    expect(parsePosts({})).toEqual([]);
  });

  it('returns one post for a single valid module', () => {
    const result = parsePosts({ 'a.md': makeMod() });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test-post');
  });

  it('sorts posts newest-first by publishedAt', () => {
    const modules = {
      'old.md': makeMod({ slug: 'old', publishedAt: '2025-01-01' }),
      'new.md': makeMod({ slug: 'new', publishedAt: '2026-05-01' }),
      'mid.md': makeMod({ slug: 'mid', publishedAt: '2025-06-01' })
    };
    const result = parsePosts(modules);
    expect(result[0].slug).toBe('new');
    expect(result[1].slug).toBe('mid');
    expect(result[2].slug).toBe('old');
  });

  it('filters out posts missing a title', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod({ slug: 'valid' }),
      'notitle.md': { metadata: { slug: 'no-title', publishedAt: '2026-01-01' }, default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('valid');
  });

  it('filters out posts missing a slug', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod({ slug: 'valid' }),
      'noslug.md': { metadata: { title: 'No Slug', publishedAt: '2026-01-01' }, default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
  });

  it('filters out posts missing publishedAt', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod(),
      'nodate.md': { metadata: { title: 'No Date', slug: 'no-date' }, default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
  });

  it('filters out modules with no metadata at all', () => {
    const modules: Record<string, RawPostModule> = {
      'valid.md': makeMod(),
      'bad.md': { default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
  });

  it('preserves all frontmatter fields', () => {
    const result = parsePosts({ 'a.md': makeMod({ cefr: 'B1' }) });
    expect(result[0].cefr).toBe('B1');
    expect(result[0].description).toBe('A test post.');
  });
});

// ── findPostBySlug ────────────────────────────────────────────────────────────

describe('findPostBySlug', () => {
  const modules = {
    'sakte.md': makeMod({ slug: 'sakte-vs-langsomt', title: 'Sakte vs Langsomt' }),
    'denne.md': makeMod({ slug: 'denne-vs-dette', title: 'Denne vs Dette' })
  };

  it('returns the matching post when slug exists', () => {
    const result = findPostBySlug(modules, 'sakte-vs-langsomt');
    expect(result).not.toBeNull();
    expect(result!.meta.title).toBe('Sakte vs Langsomt');
  });

  it('returns null for an unknown slug', () => {
    expect(findPostBySlug(modules, 'does-not-exist')).toBeNull();
  });

  it('returns null for an empty module map', () => {
    expect(findPostBySlug({}, 'sakte-vs-langsomt')).toBeNull();
  });

  it('returns the content (Svelte component) alongside meta', () => {
    const result = findPostBySlug(modules, 'denne-vs-dette');
    expect(result).toHaveProperty('content');
  });

  it('is case-sensitive — slug must match exactly', () => {
    expect(findPostBySlug(modules, 'Sakte-vs-langsomt')).toBeNull();
    expect(findPostBySlug(modules, 'SAKTE-VS-LANGSOMT')).toBeNull();
  });

  it('matches the second post correctly', () => {
    const result = findPostBySlug(modules, 'denne-vs-dette');
    expect(result!.meta.title).toBe('Denne vs Dette');
  });
});
