import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isQuizableEntry } from '$lib/quiz-gate';
import type { CEFRLevel } from '$lib/types';

import vocabA1 from '$lib/data/vocab-a1.json';
import vocabA2 from '$lib/data/vocab-a2.json';
import vocabB1 from '$lib/data/vocab-b1.json';
import vocabB2 from '$lib/data/vocab-b2.json';
import vocabC from '$lib/data/vocab-c.json';
import uttrykkA1 from '$lib/data/uttrykk-a1.json';
import uttrykkA2 from '$lib/data/uttrykk-a2.json';
import uttrykkB1 from '$lib/data/uttrykk-b1.json';
import uttrykkB2 from '$lib/data/uttrykk-b2.json';
import uttrykkC from '$lib/data/uttrykk-c.json';

// scripts/build-cloze-sidecars.mjs writes the cloze-*.json sidecars
// (ai-docs/implementation/cloze-quiz.md, Phase 0). These tests fail when a sidecar is
// stale (an example was edited without running `pnpm cloze:build`) or malformed.

type Entry = {
  id: string;
  norsk: string;
  example: string;
  level: CEFRLevel;
  category: string;
  definition?: string;
};
type Item = { before: string; answer: string; after: string };
type Count = { level: string; category: string; vocab: number; uttrykk: number };

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'] as const;
const TYPES = ['vocab', 'uttrykk'] as const;

const SOURCES: Record<(typeof LEVELS)[number], Record<(typeof TYPES)[number], Entry[]>> = {
  A1: { vocab: vocabA1 as Entry[], uttrykk: uttrykkA1 as Entry[] },
  A2: { vocab: vocabA2 as Entry[], uttrykk: uttrykkA2 as Entry[] },
  B1: { vocab: vocabB1 as Entry[], uttrykk: uttrykkB1 as Entry[] },
  B2: { vocab: vocabB2 as Entry[], uttrykk: uttrykkB2 as Entry[] },
  C: { vocab: vocabC as Entry[], uttrykk: uttrykkC as Entry[] }
};

const modules = import.meta.glob('/src/lib/data/cloze-{vocab,uttrykk}-*.json', {
  eager: true,
  import: 'default'
}) as Record<string, Record<string, Item>>;
const countModules = import.meta.glob('/src/lib/data/cloze-counts.json', {
  eager: true,
  import: 'default'
}) as Record<string, Count[]>;

function sidecar(type: string, level: string): Record<string, Item> | undefined {
  return modules[`/src/lib/data/cloze-${type}-${level.toLowerCase()}.json`];
}

const HOW_TO_FIX = 'Run `pnpm cloze:build` and commit the result.';

describe('cloze sidecars match the content files', () => {
  it('has one sidecar per level and type', () => {
    for (const level of LEVELS) {
      for (const type of TYPES) {
        expect(
          sidecar(type, level),
          `cloze-${type}-${level.toLowerCase()}.json. ${HOW_TO_FIX}`
        ).toBeDefined();
      }
    }
  });

  it('every id resolves to an entry of the same file, and before + answer + after is its example', () => {
    const problems: string[] = [];
    for (const level of LEVELS) {
      for (const type of TYPES) {
        const items = sidecar(type, level) ?? {};
        const byId = new Map(SOURCES[level][type].map((e) => [e.id, e]));
        for (const [id, item] of Object.entries(items)) {
          const entry = byId.get(id);
          if (!entry) {
            problems.push(`${id}: not in ${type}-${level.toLowerCase()}.json`);
            continue;
          }
          if (item.before + item.answer + item.after !== entry.example) {
            problems.push(`${id}: before + answer + after differs from the example`);
          }
          if ([...item.answer.matchAll(/[\p{L}\p{N}]/gu)].length < 3) {
            problems.push(`${id}: answer ${JSON.stringify(item.answer)} is too short`);
          }
          if (!isQuizableEntry(entry)) {
            problems.push(`${id}: entry is not quizable (no definition at B2 or C)`);
          }
        }
      }
    }
    expect(problems.slice(0, 20), HOW_TO_FIX).toEqual([]);
  });

  it('cloze-counts.json matches the sidecars', () => {
    const expected = new Map<string, Count>();
    for (const level of LEVELS) {
      for (const type of TYPES) {
        const items = sidecar(type, level) ?? {};
        for (const e of SOURCES[level][type]) {
          if (!items[e.id]) continue;
          const key = `${level}|${e.category}`;
          const row = expected.get(key) ?? { level, category: e.category, vocab: 0, uttrykk: 0 };
          row[type]++;
          expected.set(key, row);
        }
      }
    }
    const actual = new Map(
      (countModules['/src/lib/data/cloze-counts.json'] ?? []).map((r) => [
        `${r.level}|${r.category}`,
        r
      ])
    );
    expect([...actual.keys()].sort(), HOW_TO_FIX).toEqual([...expected.keys()].sort());
    for (const [key, row] of expected) {
      expect(actual.get(key), key).toEqual(row);
    }
  });
});

describe('the generator reproduces the committed files', () => {
  it(
    'writes identical sidecars and counts (so the committed ones are not stale)',
    { timeout: 90_000 },
    () => {
      const root = fileURLToPath(new URL('../../', import.meta.url));
      const dataDir = join(root, 'src/lib/data');
      const tmp = mkdtempSync(join(tmpdir(), 'cloze-'));
      try {
        // A finite timeout, so a slow or non-terminating generator cannot block the worker.
        const run = spawnSync(process.execPath, [join(root, 'scripts/build-cloze-sidecars.mjs')], {
          encoding: 'utf-8',
          timeout: 60_000,
          env: {
            ...process.env,
            CLOZE_OUT_DIR: join(tmp, 'out'),
            CLOZE_REPORT_DIR: join(tmp, 'rep')
          }
        });
        expect(run.status, run.error?.message ?? run.stderr).toBe(0);
        const files = readdirSync(join(tmp, 'out')).filter((f) => f.startsWith('cloze-'));
        expect(files.length).toBe(11);
        for (const f of files) {
          expect(readFileSync(join(tmp, 'out', f), 'utf-8'), `${f}. ${HOW_TO_FIX}`).toBe(
            readFileSync(join(dataDir, f), 'utf-8')
          );
        }
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  );
});
