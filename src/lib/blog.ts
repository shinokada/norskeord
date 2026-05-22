export interface PostMeta {
  title: string;
  description: string;
  slug: string;
  cefr: string | string[];
  publishedAt: string;
  tags?: string[];
  type?: 'word' | 'guide';
}

// Loose shape used for raw glob imports and test fixtures — metadata may be partial.
export type RawPostModule = { metadata?: Partial<PostMeta>; default?: unknown };

/** Normalise cefr to an array regardless of whether it was stored as a string or array. */
export function cefrLevels(cefr: string | string[]): string[] {
  return Array.isArray(cefr) ? cefr : [cefr];
}

/** Sort posts newest-first, filter out any with missing required fields. */
export function parsePosts(modules: Record<string, RawPostModule>): PostMeta[] {
  return Object.values(modules)
    .map((mod) => mod.metadata)
    .filter((m): m is PostMeta => !!(m?.title && m?.slug && m?.publishedAt))
    .map((m) => ({ ...m, type: m.type ?? 'word' }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/** Find a post by slug. Returns null if not found. */
export function findPostBySlug(
  modules: Record<string, RawPostModule>,
  slug: string
): { meta: PostMeta; content: unknown } | null {
  for (const mod of Object.values(modules)) {
    if (mod.metadata?.slug === slug && mod.metadata.title && mod.metadata.publishedAt) {
      return { meta: mod.metadata as PostMeta, content: mod.default };
    }
  }
  return null;
}
