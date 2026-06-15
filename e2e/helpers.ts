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
  await page.route('**', async (route) => {
    const request = route.request();
    const url = request.url();

    // Strategy 3: patch /api/plan response — needed because Nav.svelte now
    // fetches plan client-side on prerendered/cached pages where page.data.plan
    // is not available. Without this, clientIsPlus stays false and the search
    // button never appears even when the HTML is patched.
    if (url.includes('/api/plan')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'plus' })
      });
      return;
    }

    // Strategy 2: patch __data.json (covers ssr:false routes like /quiz).
    if (url.includes('__data.json')) {
      const response = await route.fetch();
      try {
        const text = await response.text();
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

export async function injectLoggedInUser(page: Page) {
  await setNorwegianLocale(page);
  await page.route('**', async (route) => {
    const request = route.request();
    if (request.resourceType() === 'document') {
      const response = await route.fetch();
      const body = await response.text();
      const patched = body
        .replace(/plan:"free"/, 'plan:"plus"')
        .replace(
          /user:null/,
          'user:{id:"00000000-0000-0000-0000-000000000001",email:"test@example.com",app_metadata:{},user_metadata:{},aud:"authenticated",created_at:"2024-01-01T00:00:00Z"}'
        );
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
