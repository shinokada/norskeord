// /src/routes/sitemap.xml/+server.ts
import * as sitemap from 'super-sitemap';
import type { RequestHandler } from '@sveltejs/kit';
import { CATEGORIES_BY_LEVEL } from '$lib/types';

export const GET: RequestHandler = async () => {
  // Build all public [level]/[category] paths (free categories only — Plus gated pages redirect)
  const categoryPaths: string[] = [];
  const freeLevels = ['A1', 'A2'] as const;
  for (const level of freeLevels) {
    for (const cat of CATEGORIES_BY_LEVEL[level]) {
      categoryPaths.push(`/${level.toLowerCase()}/${cat}`);
    }
  }
  // Add the free subset of B1 and B2
  const freeB1 = [
    'travel',
    'environment',
    'media',
    'culture',
    'technology',
    'relationships',
    'education',
    'work',
    'norwegian-society',
    'health-body-intermediate'
  ];
  const freeB2 = ['politics', 'economics', 'social-issues', 'science', 'uttrykk-preview'];
  const freeC1 = ['philosophy', 'academic', 'formal-writing', 'rhetoric', 'complex-emotions'];
  const freeC2 = ['literary', 'archaic', 'proverbs', 'highly-formal'];
  for (const cat of freeB1) categoryPaths.push(`/b1/${cat}`);
  for (const cat of freeB2) categoryPaths.push(`/b2/${cat}`);
  for (const cat of freeC1) categoryPaths.push(`/c1/${cat}`);
  for (const cat of freeC2) categoryPaths.push(`/c2/${cat}`);

  return await sitemap.response({
    origin: 'https://norskeord.no',
    additionalPaths: categoryPaths,
    excludeRoutePatterns: [
      '/admin.*',
      '/api.*',
      '/auth.*',
      '/my-profile',
      '/stats',
      '/quiz',
      '/norskproven/practice.*',
      '/plus'
    ]
  });
};
