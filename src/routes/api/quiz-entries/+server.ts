/**
 * POST /api/quiz-entries   body: { level: CEFRLevel, category?: string, mode?: 'words' | 'sentences' }
 *
 * Phase 3 of ai-docs/implementation/quiz-server-gating.md. The quiz used to import
 * every vocab and uttrykk file in the browser and gate them in the page, so every
 * visitor downloaded every Plus entry. The page now asks this endpoint, and only
 * when the user clicks Start.
 *
 * The gate is `selectQuizEntries` (`$lib/quiz-gate`): Plus gets every quizable entry
 * of the level (and category), free and guest callers only the entries that pass the
 * free quiz policy. The answer options (`distractors`) follow the same gate, so a
 * locked word is never offered as an option. The plan comes from `locals.plan`
 * (hooks.server.ts), never from the body.
 *
 * `mode` (cloze-quiz.md, Phase 2) defaults to 'words'; any other value than 'words' or
 * 'sentences' is a 400. In 'sentences' mode the same gate runs through
 * `selectClozeEntries`: only entries that have a cloze item are returned, together with
 * that item, and there are no distractors (the answers are typed).
 *
 * Response: words { entries, distractors }, sentences { entries, cloze }.
 * `Cache-Control: private, no-store` because the payload differs by plan.
 */

import type { RequestHandler } from './$types';
import { selectClozeEntries, selectQuizEntries } from '$lib/quiz-gate';
import { isQuizLevel, loadClozeSources, loadQuizSources } from '$lib/server/quiz-sources';
import { recordContentUsage, shouldBlock, rateLimitedResponse } from '$lib/server/content-usage';

const MAX_CATEGORY_LENGTH = 100;

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export const POST: RequestHandler = async ({ request, locals }) => {
  const isPlus = locals.plan === 'plus';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: NO_STORE });
  }

  const { level, category, mode } = (body ?? {}) as {
    level?: unknown;
    category?: unknown;
    mode?: unknown;
  };
  if (!isQuizLevel(level)) {
    return new Response('level must be one of A1, A2, B1, B2, C', {
      status: 400,
      headers: NO_STORE
    });
  }
  if (
    category !== undefined &&
    (typeof category !== 'string' || category.length > MAX_CATEGORY_LENGTH)
  ) {
    return new Response('category must be a short string', { status: 400, headers: NO_STORE });
  }
  if (mode !== undefined && mode !== 'words' && mode !== 'sentences') {
    return new Response("mode must be 'words' or 'sentences'", { status: 400, headers: NO_STORE });
  }

  const sources = await loadQuizSources([level]);
  const result =
    mode === 'sentences'
      ? selectClozeEntries(
          sources,
          await loadClozeSources([level]),
          level,
          category || undefined,
          isPlus
        )
      : selectQuizEntries(sources, level, category || undefined, isPlus);

  // Plus calls are counted (content-scraping-hardening.md, Phase 1); log-only for now.
  const usage = await recordContentUsage({
    userId: locals.user?.id,
    plan: locals.plan,
    endpoint: 'quiz-entries',
    entries: result.entries.length + ('distractors' in result ? result.distractors.length : 0)
  });
  if (shouldBlock(usage)) return rateLimitedResponse();

  return Response.json(result, { headers: NO_STORE });
};
