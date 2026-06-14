import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readJsonFile, writeJsonFile } from '$lib/admin/github';
import { validateQuestion } from '$lib/admin/questionUtils';
import type { RequestHandler } from './$types';
import type { GrammarQuestion } from '$lib/types';

const FILE_PATH = env.GRAMMAR_FILE_PATH ?? 'src/lib/data/grammar.json';

function assertAdmin(locals: App.Locals) {
  const userEmail = locals.user?.email;
  if (!userEmail || userEmail !== env.ADMIN_EMAIL) {
    throw error(403, 'Forbidden');
  }
}

// GET — load all questions into the editor
export const GET: RequestHandler = async ({ locals }) => {
  assertAdmin(locals);
  const { data } = await readJsonFile<GrammarQuestion[]>(FILE_PATH);
  return json(data);
};

// PUT — publish the full draft (all questions) in one commit
// Auto-retries once on SHA conflict (409)
export const PUT: RequestHandler = async ({ locals, request }) => {
  assertAdmin(locals);
  const questions: (GrammarQuestion & { _status?: string })[] = await request.json();

  // Validate all questions before touching GitHub
  for (const q of questions) {
    const issues = validateQuestion(q);
    if (issues.length) throw error(400, `Question ${q.id}: ${issues.join('; ')}`);
  }

  const added = questions.filter((q) => q._status === 'added').length;
  const edited = questions.filter((q) => q._status === 'edited').length;
  const message = buildCommitMessage(added, edited);

  // Drop deleted questions and strip internal _status flags before writing
  const clean: GrammarQuestion[] = questions
    .filter((q) => q._status !== 'deleted')
    .map((q) => {
      const copy = { ...q };
      delete copy._status;
      return copy as GrammarQuestion;
    });

  // Attempt write with auto-retry on SHA conflict
  const attempt = async (retry = false): Promise<void> => {
    const { sha } = await readJsonFile<GrammarQuestion[]>(FILE_PATH);
    try {
      await writeJsonFile(FILE_PATH, clean, sha, message);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!retry && msg.includes('409')) return attempt(true);
      throw error(500, msg);
    }
  };

  await attempt();
  return json({ ok: true, message });
};

function buildCommitMessage(added: number, edited: number): string {
  const parts: string[] = [];
  if (added) parts.push(`add ${added} question${added > 1 ? 's' : ''}`);
  if (edited) parts.push(`edit ${edited} question${edited > 1 ? 's' : ''}`);
  return `admin: ${parts.length ? parts.join(', ') : 'update grammar questions'}`;
}
