#!/usr/bin/env node
/**
 * generate-og.mjs
 *
 * Downloads pre-rendered OG images from open-graph-vercel.vercel.app
 * and saves them as static PNGs for zero-cost CDN serving.
 *
 * Usage:
 *   node scripts/generate-og.mjs          — all images
 *   node scripts/generate-og.mjs --blog   — blog only
 *   node scripts/generate-og.mjs --decks  — flashcard decks only
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = resolve(__dirname, '../static/og');
const OG_BASE = 'https://open-graph-vercel.vercel.app/api/norskeord';

const ONLY_BLOG = process.argv.includes('--blog');
const ONLY_DECKS = process.argv.includes('--decks');
const RUN_ALL = !ONLY_BLOG && !ONLY_DECKS;

// ── helpers ──────────────────────────────────────────────────────────────────

function slug2title(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  console.log(`  ✓  ${destPath.replace(__dirname + '/..', '')}`);
}

// ── blog posts ────────────────────────────────────────────────────────────────

async function generateBlog() {
  console.log('\n📝 Blog posts');
  mkdirSync(resolve(STATIC_DIR, 'blog'), { recursive: true });

  // Read frontmatter from every .md in src/lib/posts
  const { globSync } = await import('glob');
  const files = globSync('src/lib/posts/*.md', { cwd: resolve(__dirname, '..') });

  for (const file of files) {
    const raw = readFileSync(resolve(__dirname, '..', file), 'utf-8');
    const slugMatch = raw.match(/^slug:\s*(.+)$/m);
    const titleMatch = raw.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
    const cefrMatch = raw.match(/^cefr:\s*(.+)$/m);

    if (!slugMatch || !titleMatch) continue;

    const slug = slugMatch[1].trim();
    const title = titleMatch[1].trim();
    const level = cefrMatch
      ? cefrMatch[1]
          .trim()
          .replace(/[[\]'"]/g, '')
          .split(',')
          .map((s) => s.trim())
          .join(',')
      : '';

    const url = `${OG_BASE}?title=${encodeURIComponent(title)}&level=${encodeURIComponent(level)}`;
    const dest = resolve(STATIC_DIR, 'blog', `${slug}.png`);
    await download(url, dest);
  }
}

// ── flashcard decks ───────────────────────────────────────────────────────────

async function generateDecks() {
  console.log('\n🃏 Flashcard decks');

  // Import CATEGORIES_BY_LEVEL and PLUS_CATEGORIES directly from the source
  // using a small inline parse — avoids needing ts-node or a build step.
  const typesRaw = readFileSync(resolve(__dirname, '../src/lib/types.ts'), 'utf-8');

  // Extract the CATEGORIES_BY_LEVEL object via regex
  const match = typesRaw.match(/CATEGORIES_BY_LEVEL\s*=\s*(\{[\s\S]*?\n\})/);
  if (!match) throw new Error('Could not parse CATEGORIES_BY_LEVEL from types.ts');

  // Safely evaluate it as a JS object literal
  const obj = eval('(' + match[1] + ')');

  for (const [level, cats] of Object.entries(obj)) {
    mkdirSync(resolve(STATIC_DIR, 'deck', level.toLowerCase()), { recursive: true });

    for (const cat of cats) {
      // Skip internal/preview slugs
      if (cat === 'uttrykk-preview') continue;

      const title = slug2title(cat);
      const url = `${OG_BASE}?title=${encodeURIComponent(title)}&level=${encodeURIComponent(level)}`;
      const dest = resolve(STATIC_DIR, 'deck', level.toLowerCase(), `${cat}.png`);
      await download(url, dest);
    }
  }
}

// ── default ───────────────────────────────────────────────────────────────────

async function generateDefault() {
  console.log('\n🏠 Default');
  mkdirSync(STATIC_DIR, { recursive: true });
  await download(OG_BASE, resolve(STATIC_DIR, 'default.png'));
}

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log('Generating OG images from', OG_BASE);
  try {
    if (RUN_ALL || ONLY_BLOG) await generateBlog();
    if (RUN_ALL || ONLY_DECKS) await generateDecks();
    if (RUN_ALL) await generateDefault();
    console.log('\n✅ Done');
  } catch (e) {
    console.error('\n❌', e.message);
    process.exit(1);
  }
})();
