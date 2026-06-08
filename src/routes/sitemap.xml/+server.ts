// /src/routes/sitemap.xml/+server.ts
import * as sitemap from 'super-sitemap';
import type { RequestHandler } from '@sveltejs/kit';
import { CATEGORIES_BY_LEVEL, PLUS_CATEGORIES } from '$lib/types';
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
      levelCategoryPairs.push([level, cat]);
    }
  }

  return await sitemap.response({
    origin: 'https://norskeord.no',
    paramValues: {
      '/[level]/[category]': levelCategoryPairs,
      '/blog/[slug]': blogSlugs
    },
    excludeRoutePatterns: [
      '^/admin.*',
      '^/api.*',
      '^/auth.*',
      '^/daily.*',
      '^/my-profile.*',
      '^/stats.*',
      '^/quiz.*',
      '^/norskproven/practice.*',
      '^/plus.*'
    ],
    processPaths: (paths) => {
      return paths.map((p) => ({
        ...p,
        alternates: [
          { lang: 'en', path: p.path },
          { lang: 'nb', path: `/nb${p.path}` },
          { lang: 'x-default', path: p.path }
        ]
      }));
    }
  });
};
