#!/usr/bin/env node
/**
 * Migration: Remove /norskproven/practice
 *
 * What this does:
 * 1. Updates norskproven/+page.svelte — pill hrefs from /norskproven/practice/${test}/... → /norskproven/${test}/...
 * 2. Updates learn/[level]/+page.svelte — practice link from /norskproven/practice → /norskproven
 * 3. Updates sitemap.xml/+server.ts — adds exclusion for new session page routes
 * 4. Converts practice/[test]/{oral,reading,writing}/[level]/+page.ts to 302-redirect files
 *    so old URLs like /norskproven/practice/1/oral/a2 redirect to /norskproven/1/oral/a2
 * 5. Updates practice/oral|reading|writing/[level]/+page.ts legacy redirects to point at /norskproven/1/...
 * 6. Converts practice/+page.ts to a redirect to /norskproven
 *
 * Run from the project root:
 *   node scripts/migrate-norskproven-practice.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ROUTES = `${ROOT}/src/routes`;

// ─── helpers ──────────────────────────────────────────────────────────────────

function read(rel) {
  return readFileSync(`${ROUTES}/${rel}`, 'utf-8');
}

function write(rel, content) {
  writeFileSync(`${ROUTES}/${rel}`, content, 'utf-8');
  console.log(`  ✓ wrote ${rel}`);
}

function patch(rel, fn) {
  const original = read(rel);
  const patched = fn(original);
  if (patched === original) {
    console.log(`  – no change: ${rel}`);
  } else {
    write(rel, patched);
  }
}

// ─── 1. norskproven/+page.svelte ──────────────────────────────────────────────
// Change:  /norskproven/practice/${test}/${type.key}/${level.toLowerCase()}
// To:      /norskproven/${test}/${type.key}/${level.toLowerCase()}

patch('norskproven/+page.svelte', (src) =>
  src.replace(
    '`/norskproven/practice/${test}/${type.key}/${level.toLowerCase()}`',
    '`/norskproven/${test}/${type.key}/${level.toLowerCase()}`'
  )
);

// ─── 2. learn/[level]/+page.svelte ────────────────────────────────────────────
// Change href="/norskproven/practice" → href="/norskproven"

patch('learn/[level]/+page.svelte', (src) =>
  src.replace('href="/norskproven/practice"', 'href="/norskproven"')
);

// ─── 3. sitemap.xml/+server.ts ────────────────────────────────────────────────
// The session pages under norskproven/[test]/... should also be excluded.
// Add '^/norskproven/[^/]+/.*' after the existing practice exclusion.

patch('sitemap.xml/+server.ts', (src) =>
  src.replace(
    "'^/norskproven/practice.*',",
    "'^/norskproven/practice.*',\n      '^/norskproven/[^/]+/.*',"
  )
);

// ─── 4. practice/[test]/{oral,reading,writing}/[level]/+page.ts ──────────────
// These currently serve real content (they were the old active routes).
// Convert them to simple 302 redirects → /norskproven/${test}/${type}/${level}

const REDIRECT_TEMPLATE = (type) => `import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

// Old URL: /norskproven/practice/[test]/${type}/[level]
// Redirect to the new URL without /practice
export const load: PageLoad = async ({ params }) => {
  redirect(302, \`/norskproven/\${params.test}/${type}/\${params.level}\`);
};
`;

for (const type of ['oral', 'reading', 'writing']) {
  write(`norskproven/practice/[test]/${type}/[level]/+page.ts`, REDIRECT_TEMPLATE(type));
}

// ─── 5. Legacy practice/{oral,reading,writing}/[level]/+page.ts ──────────────
// These currently redirect to /norskproven/practice/1/...
// Update them to redirect to /norskproven/1/...

const LEGACY_REDIRECT_TEMPLATE = (type) => `import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

// Old URL: /norskproven/practice/${type}/[level]
// Redirect to new URL with test defaulting to 1
export const load: PageLoad = async ({ params }) => {
  redirect(302, \`/norskproven/1/${type}/\${params.level}\`);
};
`;

for (const type of ['oral', 'reading', 'writing']) {
  write(`norskproven/practice/${type}/[level]/+page.ts`, LEGACY_REDIRECT_TEMPLATE(type));
}

// ─── 6. practice/+page.ts — redirect index page to /norskproven ──────────────
write(
  'norskproven/practice/+page.ts',
  `import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

// /norskproven/practice is now merged into /norskproven
export const load: PageLoad = async () => {
  redirect(302, '/norskproven');
};
`
);

// ─── done ─────────────────────────────────────────────────────────────────────
console.log('\nAll done. Next steps:');
console.log('  • Run your dev server and verify /norskproven pill links work');
console.log('  • Check /learn/a2 and /learn/b1 practice test card links');
console.log('  • Visit /norskproven/practice → should redirect to /norskproven');
console.log(
  '  • Visit /norskproven/practice/1/oral/a2 → should redirect to /norskproven/1/oral/a2'
);
console.log('  • Visit /norskproven/practice/oral/a2 → should redirect to /norskproven/1/oral/a2');
console.log('  • Run your e2e test suite');
console.log('  • Once happy: rm -rf src/routes/norskproven/practice');
