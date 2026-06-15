// /src/routes/sitemap.xml/+server.ts
import * as sitemap from 'super-sitemap';
import type { RequestHandler } from '@sveltejs/kit';
import { CATEGORIES_BY_LEVEL, PLUS_CATEGORIES, FREE_GRAMMAR_TOPICS } from '$lib/types';
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
  const levelCategoryPairs: [string, string][] = [];

  // C level is handled separately via the dedicated /c/[category] route
  const levelEntries: [string, readonly string[]][] = [
    ['a1', CATEGORIES_BY_LEVEL['A1']],
    ['a2', CATEGORIES_BY_LEVEL['A2']],
    ['b1', CATEGORIES_BY_LEVEL['B1']],
    ['b2', CATEGORIES_BY_LEVEL['B2']]
  ];

  for (const [level, cats] of levelEntries) {
    for (const cat of cats) {
      // Skip Plus-only categories
      if (PLUS_CATEGORIES.has(`${level}/${cat}`)) continue;
      levelCategoryPairs.push([level, cat]);
    }
  }

  // Build free C categories for the dedicated /c/[category] route
  const cCategories: [string][] = CATEGORIES_BY_LEVEL['C']
    .filter((cat) => !PLUS_CATEGORIES.has(`c/${cat}`))
    .map((cat) => [cat]);

  // Free grammar topics for /grammar/[topic]
  const grammarTopics: [string][] = [...FREE_GRAMMAR_TOPICS].map((topic) => [topic]);

  // CEFR levels for /learn/[level] — only a1–b2; /learn/c is a separate static route
  const learnLevels: [string][] = ['a1', 'a2', 'b1', 'b2'].map((l) => [l]);

  return await sitemap.response({
    origin: 'https://norskeord.no',
    paramValues: {
      '/[level]/[category]': levelCategoryPairs,
      '/c/[category]': cCategories,
      '/blog/[slug]': blogSlugs,
      '/grammar/[topic]': grammarTopics,
      '/learn/[level]': learnLevels
    },
    excludeRoutePatterns: [
      '^/admin.*',
      '^/api.*',
      '^/auth.*',
      '^/daily.*',
      '^/my-profile.*',
      '^/stats.*',
      '^/quiz.*',
      '^/norskproven/.*',
      '^/plus.*'
    ],
    processPaths: (paths) => {
      return paths.map((p) => ({
        ...p,
        alternates: [
          { lang: 'en', path: p.path },
          { lang: 'x-default', path: p.path }
        ]
      }));
    }
  });
};
