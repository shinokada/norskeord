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

/** Returns true if publishedAt is today or in the past. */
export function isPublished(publishedAt: string, now = new Date()): boolean {
  const publish = new Date(publishedAt);
  // Compare date only (ignore time) so timezone differences don't flip a post on/off mid-day.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const publishDay = new Date(publish.getFullYear(), publish.getMonth(), publish.getDate());
  return publishDay <= today;
}

/** Sort posts newest-first, filter out any with missing required fields or a future publishedAt. */
export function parsePosts(modules: Record<string, RawPostModule>, now = new Date()): PostMeta[] {
  return Object.values(modules)
    .map((mod) => mod.metadata)
    .filter(
      (m): m is PostMeta =>
        !!(m?.title && m?.slug && m?.publishedAt && isPublished(m.publishedAt, now))
    )
    .map((m) => ({ ...m, type: m.type ?? 'word' }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/** Find a post by slug. Returns null if not found or if publishedAt is in the future. */
export function findPostBySlug(
  modules: Record<string, RawPostModule>,
  slug: string,
  now = new Date()
): { meta: PostMeta; content: unknown } | null {
  for (const mod of Object.values(modules)) {
    if (
      mod.metadata?.slug === slug &&
      mod.metadata.title &&
      mod.metadata.publishedAt &&
      isPublished(mod.metadata.publishedAt, now)
    ) {
      return { meta: mod.metadata as PostMeta, content: mod.default };
    }
  }
  return null;
}
