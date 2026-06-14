import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readJsonFile, writeJsonFile } from '$lib/admin/github';
import type { RequestHandler } from './$types';
import type { VocabEntry } from '$lib/types';

const LEVEL_FILE: Record<string, string> = {
  A1: 'src/lib/data/vocab-a1.json',
  A2: 'src/lib/data/vocab-a2.json',
  B1: 'src/lib/data/vocab-b1.json',
  B2: 'src/lib/data/vocab-b2.json',
  C: 'src/lib/data/vocab-c.json'
};

function assertAdmin(locals: App.Locals) {
  const userEmail = locals.user?.email;
  if (!userEmail || userEmail !== env.ADMIN_EMAIL) {
    throw error(403, 'Forbidden');
  }
}

function getFilePath(url: URL): string {
  const level = url.searchParams.get('level')?.toUpperCase();
  if (!level || !LEVEL_FILE[level]) {
    throw error(400, `Missing or invalid ?level= (expected A1, A2, B1, B2, or C)`);
  }
  return LEVEL_FILE[level];
}

function validateEntry(e: Partial<VocabEntry>): string[] {
  const errs: string[] = [];
  if (!e.norsk?.trim()) errs.push('norsk is required');
  if (!e.english?.trim()) errs.push('english is required');
  if (!e.level) errs.push('level is required');
  if (!e.category) errs.push('category is required');
  if (!e.part) errs.push('part is required');
  return errs;
}

// GET /admin/vocab/api?level=A1  — load all entries for a level
export const GET: RequestHandler = async ({ locals, url }) => {
  assertAdmin(locals);
  const filePath = getFilePath(url);
  const { data } = await readJsonFile<VocabEntry[]>(filePath);
  return json(data);
};

// PUT /admin/vocab/api?level=A1  — publish full entry list for a level
export const PUT: RequestHandler = async ({ locals, url, request }) => {
  assertAdmin(locals);
  const filePath = getFilePath(url);
  const level = url.searchParams.get('level')!.toUpperCase();

  const entries: (VocabEntry & { _status?: string })[] = await request.json();

  for (const e of entries) {
    const issues = validateEntry(e);
    if (issues.length) throw error(400, `Entry "${e.norsk}": ${issues.join('; ')}`);
  }

  const added = entries.filter((e) => e._status === 'added').length;
  const edited = entries.filter((e) => e._status === 'edited').length;
  const deleted = entries.filter((e) => e._status === 'deleted').length;
  const parts: string[] = [];
  if (added) parts.push(`add ${added}`);
  if (edited) parts.push(`edit ${edited}`);
  if (deleted) parts.push(`delete ${deleted}`);
  const message = `admin: vocab ${level} — ${parts.length ? parts.join(', ') : 'update entries'}`;

  const clean: VocabEntry[] = entries
    .filter((e) => e._status !== 'deleted')
    .map((e) => {
      const copy = { ...e };
      delete (copy as Record<string, unknown>)._status;
      return copy as VocabEntry;
    });

  const attempt = async (retry = false): Promise<void> => {
    const { sha } = await readJsonFile<VocabEntry[]>(filePath);
    try {
      await writeJsonFile(filePath, clean, sha, message);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!retry && msg.includes('409')) return attempt(true);
      throw error(500, msg);
    }
  };

  await attempt();
  return json({ ok: true, message });
};
