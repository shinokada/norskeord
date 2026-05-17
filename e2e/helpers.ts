import { type Page } from '@playwright/test';

/**
 * Patch plan → 'plus' for both SSR and CSR (ssr:false) routes.
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
  // Strategy 1: patch the HTML document (covers SSR routes).
  await page.route('**', async (route) => {
    const request = route.request();
    const url = request.url();

    // Strategy 2: patch __data.json (covers ssr:false routes like /quiz).
    if (url.includes('__data.json')) {
      const response = await route.fetch();
      try {
        const json = await response.json();
        if (Array.isArray(json.nodes)) {
          for (const node of json.nodes) {
            if (node?.type === 'data' && Array.isArray(node.data)) {
              const indexMap = node.data[0];
              if (indexMap && typeof indexMap === 'object' && 'plan' in indexMap) {
                const planIndex = indexMap.plan;
                if (typeof planIndex === 'number') {
                  node.data[planIndex] = 'plus';
                }
              }
            }
          }
        }
        await route.fulfill({ json });
      } catch {
        await route.fulfill({ response });
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
