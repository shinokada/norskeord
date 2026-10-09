// /src/routes/sitemap.xml/+server.ts
import * as sitemap from 'super-sitemap/sveltekit';
import type { RequestHandler } from '@sveltejs/kit';
import { CATEGORIES_BY_LEVEL, PLUS_CATEGORIES } from '$lib/config';
import { indexableTopics } from '$lib/grammar/seo';
import { parsePosts, type RawPostModule } from '$lib/blog';

export const GET: RequestHandler = async () => {
  // Blog slugs — only published posts
  const modules = import.meta.glob('/src/lib/posts/*.md', { eager: true }) as Record<
    string,
    RawPostModule
  >;
  const blogSlugs = parsePosts(modules).map((p) => p.slug);

  // Build all public [level]/[category] param pairs (free categories only)
  // super-sitemap expects an array of tuples: [[level, category], ...]
  // C now shares the same [level]/[category] route as A1–B2.
  const levelCategoryPairs: [string, string][] = [];

  const levelEntries: [string, readonly string[]][] = [
    ['a1', CATEGORIES_BY_LEVEL['A1']],
    ['a2', CATEGORIES_BY_LEVEL['A2']],
    ['b1', CATEGORIES_BY_LEVEL['B1']],
    ['b2', CATEGORIES_BY_LEVEL['B2']],
    ['c', CATEGORIES_BY_LEVEL['C']]
  ];

  for (const [level, cats] of levelEntries) {
    for (const cat of cats) {
      // Skip Plus-only categories
      if (PLUS_CATEGORIES.has(`${level}/${cat}`)) continue;
      // Skip the full uttrykk deck route itself — it's gated per-theme now
      // (see ai-docs/implementation/uttrykk-gate.md Phase 1), so it's no
      // longer in PLUS_CATEGORIES, but /{level}/uttrykk with no ?theme=
      // still redirects free users (and crawlers) to /plus. A sitemap entry
      // can't carry a ?theme= query param, so there's no URL for this slug
      // that both (a) matches what's actually in the sitemap param list and
      // (b) never redirects for a logged-out crawler — omit it, same as it
      // was omitted (via the PLUS_CATEGORIES check) before this change.
      if (cat === 'uttrykk') continue;
      levelCategoryPairs.push([level, cat]);
    }
  }

  // Grammar topics for /grammar/[topic]: only topics with free A1 content are
  // indexable (grammar-update.md Phase 6b); the rest are `noindex` and stay out
  // of the sitemap. See $lib/grammar/seo.ts.
  const grammarTopics: [string][] = indexableTopics().map((topic) => [topic]);

  // CEFR levels for /learn/[level] — /learn/c now shares this dynamic route too
  const learnLevels: [string][] = ['a1', 'a2', 'b1', 'b2', 'c'].map((l) => [l]);

  return await sitemap.response({
    origin: 'https://norskeord.no',
    paramValues: {
      '/[level]/[category]': levelCategoryPairs,
      '/blog/[slug]': blogSlugs,
      '/grammar/[topic]': grammarTopics,
      '/learn/[level]': learnLevels
    },
    excludeRoutePatterns: [
      /^\/admin.*/,
      /^\/api.*/,
      /^\/auth.*/,
      /^\/daily.*/,
      // Chapter pages are client-rendered (ssr = false) and have no paramValues;
      // without this exclusion super-sitemap throws for the whole sitemap.
      /^\/grammar\/chapter\/.*/,
      /^\/my-profile.*/,
      /^\/my-progress.*/,
      /^\/quiz.*/,
      /^\/norskproven\/.*/,
      /^\/plus\/.+/
    ],
    processPaths: (paths) => {
      return paths.map((p) => ({
        ...p,
        alternates: [
          { hreflang: 'en', path: p.path },
          { hreflang: 'x-default', path: p.path }
        ]
      }));
    }
  });
};
