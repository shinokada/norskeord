#!/usr/bin/env node
/**
 * migrate-c1-c2.mjs
 *
 * Patches the remaining files that still reference C1/C2 after the
 * level-c merge. Run from the norskeord project root:
 *
 *   node scripts/migrate-c1-c2.mjs
 *
 * Files touched:
 *   src/routes/blog/+page.svelte          — cefrOrder, cefrColors
 *   src/routes/blog/[slug]/+page.svelte   — cefrColors
 *   src/lib/components/Search.svelte      — LEVELS filter array
 *   src/routes/quiz/+page.svelte          — ALL_LEVELS array
 *   src/routes/quiz/+page.ts             — allLevels validation, comments
 *   src/routes/my-profile/+page.server.ts — validLevels array
 *   src/routes/c/[category]/+page.server.ts — pageKeywords string
 *   src/routes/about/+page.svelte         — prose "up to C2"
 *   src/routes/plus/+page.server.ts       — description "A1–C2"
 *   src/routes/stats/+page.svelte         — regex in buildShareText
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

/** Read → transform → write, reporting what changed. */
function patch(relPath, transform) {
  const abs = join(ROOT, relPath);
  let src;
  try {
    src = readFileSync(abs, 'utf8');
  } catch (e) {
    console.error(`  ✗ Could not read ${relPath}: ${e.message}`);
    return;
  }
  const result = transform(src);
  if (result === src) {
    console.log(`  – ${relPath} (no changes needed)`);
    return;
  }
  writeFileSync(abs, result, 'utf8');
  console.log(`  ✓ ${relPath}`);
}

// ── 1. blog/+page.svelte ──────────────────────────────────────────────────────
patch('src/routes/blog/+page.svelte', (s) =>
  s
    // cefrOrder array
    .replace(
      `const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];`,
      `const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C'];`
    )
    // cefrColors object — replace the C1/C2 lines with a single C entry
    .replace(/C1:\s*'purple',\s*\n\s*C2:\s*'pink'/, `C: 'purple'`)
);

// ── 2. blog/[slug]/+page.svelte ───────────────────────────────────────────────
patch('src/routes/blog/[slug]/+page.svelte', (s) =>
  s.replace(/C1:\s*'purple',\s*\n\s*C2:\s*'pink'/, `C: 'purple'`)
);

// ── 3. Search.svelte ──────────────────────────────────────────────────────────
patch('src/lib/components/Search.svelte', (s) =>
  s.replace(
    `const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;`,
    `const LEVELS = ['all', 'A1', 'A2', 'B1', 'B2', 'C'] as const;`
  )
);

// ── 4. quiz/+page.svelte ──────────────────────────────────────────────────────
patch('src/routes/quiz/+page.svelte', (s) =>
  s.replace(
    `const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];`,
    `const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'];`
  )
);

// ── 5. quiz/+page.ts ─────────────────────────────────────────────────────────
patch('src/routes/quiz/+page.ts', (s) =>
  s
    // Comment at top of file
    .replace(
      '// Load all A1–C2 levels so the distractor pool covers every quiz level.',
      '// Load all A1–C levels so the distractor pool covers every quiz level.'
    )
    // Comment inside load()
    .replace(
      '// Validate level param against all known CEFR levels (A1–C2).',
      '// Validate level param against all known CEFR levels (A1–C).'
    )
    // allLevels validation array
    .replace(
      `const allLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];`,
      `const allLevels = ['a1', 'a2', 'b1', 'b2', 'c'];`
    )
    // Comment in load() about "all known CEFR levels (A1–C2)"
    .replace('// all known CEFR levels (A1–C2).', '// all known CEFR levels (A1–C).')
);

// ── 6. my-profile/+page.server.ts ────────────────────────────────────────────
patch('src/routes/my-profile/+page.server.ts', (s) =>
  s.replace(
    `const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];`,
    `const validLevels = ['A1', 'A2', 'B1', 'B2', 'C'];`
  )
);

// ── 7. c/[category]/+page.server.ts ──────────────────────────────────────────
patch('src/routes/c/[category]/+page.server.ts', (s) =>
  s.replace('`C1 C2 Norwegian`', '`C Norwegian`')
);

// ── 8. about/+page.svelte ─────────────────────────────────────────────────────
patch('src/routes/about/+page.svelte', (s) =>
  s.replace(
    'from everyday A1 words all the way up to C2.',
    'from everyday A1 words all the way up to C (Mastery).'
  )
);

// ── 9. plus/+page.server.ts ───────────────────────────────────────────────────
patch('src/routes/plus/+page.server.ts', (s) =>
  s.replace('full A1–C2 vocabulary access', 'full A1–C vocabulary access')
);

// ── 10. stats/+page.svelte ────────────────────────────────────────────────────
// The regex `\b(A1|A2|B1|B2|C1|C2)\b` in buildShareText is used to extract a
// level string from the cefrEstimate string. Since cefrEstimate now only ever
// contains 'C' (not 'C1'/'C2'), update the regex accordingly.
patch('src/routes/stats/+page.svelte', (s) =>
  s.replace('/\\b(A1|A2|B1|B2|C1|C2)\\b/', '/\\b(A1|A2|B1|B2|C)\\b/')
);

console.log('\nDone. Run `pnpm check` to verify no type errors were introduced.');
