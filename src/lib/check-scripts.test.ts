/**
 * Fixture test for the `sense` rules in the data scripts (Phase 5 of
 * ai-docs/implementation/vocab-multiple-senses.md):
 *
 *   - scripts/check-vocab.ts  (sense format, identical-`norsk` groups, --draft mode)
 *   - scripts/find_dupes.py   (distinct senses are not duplicates)
 *
 * Both scripts run as real child processes against a throwaway data tree in the OS temp
 * dir (`--data-dir`, `--draft-dir`, `--out`), so no production data or tracked report file
 * is touched. The tests assert on exit codes and on the lines the scripts print.
 *
 * Needs `tsx` (a devDependency). The find_dupes.py half is skipped when `python3` is missing.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CHECK_VOCAB = join(ROOT, 'scripts', 'check-vocab.ts');
const FIND_DUPES = join(ROOT, 'scripts', 'find_dupes.py');

const tempRoots: string[] = [];
afterAll(() => {
  for (const dir of tempRoots) rmSync(dir, { recursive: true, force: true });
});

/** A fully valid A1 noun entry, so the only findings in a run are the ones a test provokes. */
function entry(over: Record<string, unknown> = {}) {
  return {
    id: 'w-900001',
    norsk: 'kasse (en)',
    lemma: 'kasse',
    english: 'a crate',
    example: 'Det er en kasse.',
    example_english: 'It is a crate.',
    level: 'A1',
    category: 'home',
    part: 'noun',
    ...over
  };
}

/** Writes `prod` as vocab-a1.json and, when given, `draft` as draft/a1/vocab-a1-new.json. */
function makeTree(prod: object[], draft?: object[]) {
  const root = mkdtempSync(join(tmpdir(), 'sense-check-'));
  tempRoots.push(root);
  const dataDir = join(root, 'data');
  const draftDir = join(root, 'draft');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'vocab-a1.json'), JSON.stringify(prod));
  if (draft) {
    mkdirSync(join(draftDir, 'a1'), { recursive: true });
    writeFileSync(join(draftDir, 'a1', 'vocab-a1-new.json'), JSON.stringify(draft));
  }
  return { root, dataDir, draftDir };
}

function run(cmd: string, args: string[]) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function checkVocab(tree: ReturnType<typeof makeTree>, extra: string[] = []) {
  return run(process.execPath, [
    '--import',
    'tsx',
    CHECK_VOCAB,
    'a1',
    '--strict',
    `--data-dir=${tree.dataDir}`,
    `--draft-dir=${tree.draftDir}`,
    ...extra
  ]);
}

describe('check-vocab.ts: sense rules', { timeout: 30_000 }, () => {
  it('passes a group whose entries all have distinct senses', () => {
    const tree = makeTree([
      entry({ id: 'w-900001', sense: 'til flasker' }),
      entry({ id: 'w-900002', sense: 'i butikken', english: 'a checkout' })
    ]);
    const r = checkVocab(tree);
    expect(r.status).toBe(0);
    expect(r.out).toContain('none needing attention');
  });

  it('only warns for a legacy group with no sense at all', () => {
    const tree = makeTree([
      entry({ id: 'w-900001' }),
      entry({ id: 'w-900002', english: 'a checkout' })
    ]);
    const r = checkVocab(tree);
    expect(r.status).toBe(0);
    expect(r.out).toContain('legacy homograph');
  });

  it('errors when some entries in a group lack a sense', () => {
    const tree = makeTree([
      entry({ id: 'w-900001', sense: 'til flasker' }),
      entry({ id: 'w-900002', english: 'a checkout' })
    ]);
    const r = checkVocab(tree);
    expect(r.status).toBe(1);
    expect(r.out).toContain('lack a `sense`');
  });

  it('errors on a duplicate sense within a group', () => {
    const tree = makeTree([
      entry({ id: 'w-900001', sense: 'til flasker' }),
      entry({ id: 'w-900002', sense: 'til flasker', english: 'a checkout' })
    ]);
    const r = checkVocab(tree);
    expect(r.status).toBe(1);
    expect(r.out).toContain('duplicate `sense` values');
  });

  it('errors on a badly formatted sense', () => {
    const upper = checkVocab(makeTree([entry({ sense: 'Til flasker' })]));
    expect(upper.status).toBe(1);
    expect(upper.out).toContain('must be lowercase');

    const parens = checkVocab(makeTree([entry({ sense: 'til flasker (boks)' })]));
    expect(parens.status).toBe(1);
    expect(parens.out).toContain('must not contain parentheses');
  });

  it('--draft: a new entry that collides with a production norsk and has no sense is an error', () => {
    const tree = makeTree([entry({ id: 'w-900001' })], [entry({ id: '', english: 'a checkout' })]);
    const r = checkVocab(tree, ['--draft']);
    expect(r.status).toBe(1);
    expect(r.out).toContain('with no `sense`');
  });

  it('--draft: a new sibling passes when the production entry already has a sense', () => {
    const tree = makeTree(
      [entry({ id: 'w-900001', sense: 'til flasker' })],
      [entry({ id: '', sense: 'i butikken', english: 'a checkout' })]
    );
    const r = checkVocab(tree, ['--draft']);
    expect(r.status).toBe(0);
    expect(r.out).toContain('none needing attention');
  });

  it('rejects --data-dir / --draft-dir with an empty value (usage error, exit 2)', () => {
    for (const flag of ['data-dir', 'draft-dir']) {
      const r = run(process.execPath, ['--import', 'tsx', CHECK_VOCAB, 'a1', `--${flag}=`]);
      expect(r.status).toBe(2);
      expect(r.out).toContain(`--${flag} requires a non-empty value`);
    }
  });
});

const hasPython = spawnSync('python3', ['--version']).status === 0;

describe.skipIf(!hasPython)('find_dupes.py: sense skip', { timeout: 30_000 }, () => {
  function findDupes(prod: object[]) {
    const tree = makeTree(prod);
    const outFile = join(tree.root, 'report.txt');
    const r = run('python3', [FIND_DUPES, '--data-dir', tree.dataDir, '--out', outFile]);
    return { ...r, report: readFileSync(outFile, 'utf8') };
  }

  it('does not list a pair whose senses are all distinct', () => {
    const r = findDupes([
      entry({ id: 'w-900001', sense: 'til flasker' }),
      entry({ id: 'w-900002', sense: 'i butikken', english: 'a checkout' })
    ]);
    expect(r.status).toBe(0);
    expect(r.report).toContain('WITHIN-FILE DUPLICATES (0)');
    expect(r.report).not.toContain('kasse (en)');
  });

  it('lists the same pair when neither entry has a sense', () => {
    const r = findDupes([
      entry({ id: 'w-900001' }),
      entry({ id: 'w-900002', english: 'a checkout' })
    ]);
    expect(r.status).toBe(0);
    expect(r.report).toContain('WITHIN-FILE DUPLICATES (1)');
    expect(r.report).toContain('kasse (en)');
  });

  it('lists a pair where only one entry has a sense', () => {
    const r = findDupes([
      entry({ id: 'w-900001', sense: 'til flasker' }),
      entry({ id: 'w-900002', english: 'a checkout' })
    ]);
    expect(r.report).toContain('WITHIN-FILE DUPLICATES (1)');
  });

  it('lists a pair that shares the same sense', () => {
    const r = findDupes([
      entry({ id: 'w-900001', sense: 'til flasker' }),
      entry({ id: 'w-900002', sense: 'til flasker', english: 'a checkout' })
    ]);
    expect(r.report).toContain('WITHIN-FILE DUPLICATES (1)');
  });
});
