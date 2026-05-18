import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ parent }) => {
  const { plan } = await parent();
  // NOTE: plan gate is intentionally in +page.svelte onMount (not here) so
  // that the Playwright injectPlusPlan helper can intercept the __data.json
  // response on client-side navigations. Gating here redirects before
  // the interceptor fires on the initial page.goto().
  void plan;
  return {};
};
