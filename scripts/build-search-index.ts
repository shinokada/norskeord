#!/usr/bin/env tsx
/**
 * build-search-index.ts
 *
 * Reads all non-preview vocab and uttrykk JSON files from src/lib/data,
 * builds a flat SearchEntry[] array, and writes it to static/data/search-index.json.
 *
 * The output file is a generated artefact — add it to .gitignore.
 * It must exist before `vite build` runs, so the Vercel build command should be:
 *   pnpm search:index && pnpm build
 *
 * Usage (from project root):
 *   pnpm search:index
 *   npx tsx scripts/build-search-index.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const OUT_DIR = resolve(__dirname, '../static/data');
const OUT_FILE = resolve(OUT_DIR, 'search-index.json');

export interface SearchEntry {
  id: string;
  norsk: string;
  lemma: string;
  english: string;
  example: string;
  example_english: string;
  definition?: string;
  level: string;
  category: string;
  part?: string;
  source: 'vocab' | 'uttrykk';
  href: string;
}

const FILES: { file: string; source: 'vocab' | 'uttrykk' }[] = [
  { file: 'vocab-a1.json', source: 'vocab' },
  { file: 'vocab-a2.json', source: 'vocab' },
  { file: 'vocab-b1.json', source: 'vocab' },
  { file: 'vocab-b2.json', source: 'vocab' },
  { file: 'vocab-c1.json', source: 'vocab' },
  { file: 'vocab-c2.json', source: 'vocab' },
  { file: 'uttrykk-a1.json', source: 'uttrykk' },
  { file: 'uttrykk-a2.json', source: 'uttrykk' },
  { file: 'uttrykk-b1.json', source: 'uttrykk' },
  { file: 'uttrykk-b2.json', source: 'uttrykk' },
  { file: 'norske_metaforiske_uttrykk_B1_B2.json', source: 'uttrykk' }
];

const index: SearchEntry[] = [];
const fileCounts: { file: string; count: number }[] = [];

for (const { file, source } of FILES) {
  try {
    const raw = readFileSync(resolve(DATA_DIR, file), 'utf-8');
    const entries = JSON.parse(raw) as Record<string, unknown>[];
    const before = index.length;

    entries.forEach((e, i) => {
      const level = (e.level as string) ?? '';
      const category = (e.category as string) ?? '';
      index.push({
        id: `${source}-${level.toLowerCase()}-${String(before + i).padStart(5, '0')}`,
        norsk: (e.norsk as string) ?? '',
        lemma: (e.lemma as string) ?? (e.norsk as string) ?? '',
        english: (e.english as string) ?? '',
        example: (e.example as string) ?? '',
        example_english: (e.example_english as string) ?? '',
        definition: e.definition as string | undefined,
        level,
        category,
        part: e.part as string | undefined,
        source,
        href: `/${level.toLowerCase()}/${category}`
      });
    });

    fileCounts.push({ file, count: entries.length });
  } catch (err) {
    console.warn(`  Warning: could not read ${file} — ${(err as Error).message}`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(index));

// ── Summary table ─────────────────────────────────────────────────────────────
const colW = Math.max(...fileCounts.map((f) => f.file.length));
console.log('\nFile' + ' '.repeat(colW - 2) + '  Entries');
console.log('─'.repeat(colW + 10));
for (const { file, count } of fileCounts) {
  console.log(`${file.padEnd(colW)}  ${String(count).padStart(7)}`);
}
console.log('─'.repeat(colW + 10));
console.log(`${'TOTAL'.padEnd(colW)}  ${String(index.length).padStart(7)}`);
console.log(`\nWritten to: ${OUT_FILE}`);
