import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { NorskprovenData } from '$lib/types';

export const ssr = false;

export const load: PageLoad = async ({ params, parent }) => {
  // NOTE: plan gate is intentionally in +page.svelte onMount (not here) so
  // that the Playwright injectPlusPlan helper can intercept the __data.json
  // response on client-side navigations. Gating here redirects before
  // the interceptor fires on the initial page.goto().
  void (await parent());

  const level = params.level.toUpperCase();
  if (level !== 'A2' && level !== 'B1') redirect(302, '/norskproven');

  const test = params.test;
  if (test !== '1' && test !== '2' && test !== '3') redirect(302, '/norskproven');

  const raw =
    level === 'A2'
      ? test === '1'
        ? await import('$lib/data/norskproven-a2-1.json')
        : test === '2'
          ? await import('$lib/data/norskproven-a2-2.json')
          : await import('$lib/data/norskproven-a2-3.json')
      : test === '1'
        ? await import('$lib/data/norskproven-b1-1.json')
        : test === '2'
          ? await import('$lib/data/norskproven-b1-2.json')
          : await import('$lib/data/norskproven-b1-3.json');

  const data = raw.default as unknown as NorskprovenData;

  return { scenarios: data.oral, level: level as 'A2' | 'B1', test };
};
