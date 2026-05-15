import { type Page } from '@playwright/test';

/**
 * Intercept SvelteKit's __data.json responses and patch plan → 'plus'.
 *
 * SvelteKit serialises layout data using a deduplication format:
 * node.data is a flat array of values; node.data[0] is an object whose
 * keys map to indices into that same array. So "plan":17 means
 * node.data[17] holds the actual plan string (e.g. "free").
 */
export async function injectPlusPlan(page: Page) {
  await page.route('**/__data.json*', async (route) => {
    const response = await route.fetch();
    try {
      const json = await response.json();
      if (Array.isArray(json.nodes)) {
        for (const node of json.nodes) {
          if (node?.type === 'data' && Array.isArray(node.data)) {
            const meta = node.data[0];
            if (meta && typeof meta === 'object' && 'plan' in meta) {
              const planIndex = meta.plan as number;
              node.data[planIndex] = 'plus';
            }
          }
        }
      }
      await route.fulfill({ json });
    } catch {
      await route.fulfill({ response });
    }
  });
}
