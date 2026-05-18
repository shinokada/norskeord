import { type Page } from '@playwright/test';

/**
 * Set the Paraglide locale cookie to Norwegian ('nb') so the app renders
 * in Norwegian during tests. Without this the strategy falls back to the
 * base locale ('en') and all Norwegian text assertions fail.
 *
 * Must be called before page.goto() so the cookie is present on the first
 * request. Playwright requires the domain to be set on the cookie, so we
 * set it to 'localhost'.
 */
export async function setNorwegianLocale(page: Page) {
  await page.context().addCookies([
    {
      name: 'PARAGLIDE_LOCALE',
      value: 'nb',
      domain: 'localhost',
      path: '/'
    }
  ]);
}

/**
 * Patch plan → 'plus' for both SSR and CSR (ssr:false) routes, and also
 * set the Norwegian locale cookie so assertions match Norwegian UI text.
 *
 * Two strategies are needed:
 *
 * 1. SSR routes (e.g. /stats): SvelteKit inlines the layout data directly in
 *    the HTML as `plan:"free"`. We intercept the HTML document response and
 *    do a string replacement before the page boots.
 *
 * 2. CSR routes with ssr:false (e.g. /quiz): The HTML shell has no inlined
 *    data. SvelteKit fetches layout data via __data.json after hydration.
 *    The response is a deduplicated array where data[0] is an index map and
 *    data[data[0].plan] holds the actual plan string. We patch that index.
 */
export async function injectPlusPlan(page: Page) {
  await setNorwegianLocale(page);
  // Strategy 1: patch the HTML document (covers SSR routes).
  await page.route('**', async (route) => {
    const request = route.request();
    const url = request.url();

    // Strategy 2: patch __data.json (covers ssr:false routes like /quiz).
    if (url.includes('__data.json')) {
      const response = await route.fetch();
      try {
        const text = await response.text();
        // Replace every occurrence of the plan string value in the JSON.
        // SvelteKit deduplicates data so 'free' may appear as a bare string
        // value anywhere in the nodes array — a text replace is more robust
        // than trying to navigate the index-map structure.
        const patched = text.replace(/"free"/g, '"plus"');
        await route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body: patched
        });
      } catch {
        await route.continue();
      }
      return;
    }

    // Strategy 1: patch HTML document responses (covers SSR routes).
    if (request.resourceType() === 'document') {
      const response = await route.fetch();
      const body = await response.text();
      const patched = body.replace(/plan:"free"/, 'plan:"plus"');
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body: patched
      });
      return;
    }

    await route.continue();
  });
}
