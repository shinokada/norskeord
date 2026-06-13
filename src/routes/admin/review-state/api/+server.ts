/**
 * GET  /admin/review-state/api  — load current review state
 * PUT  /admin/review-state/api  — save updated review state
 *
 * This endpoint is intentionally lightweight: it writes only the review-state
 * sidecar file, never content files. Saving review progress does NOT trigger
 * a Vercel redeploy (review-state.json is not imported by any page route).
 */

import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readJsonFile, writeJsonFile } from '$lib/admin/github';
import { emptyReviewState } from '$lib/admin/reviewState';
import type { ReviewState } from '$lib/admin/reviewState';
import type { RequestHandler } from './$types';

const FILE_PATH = env.REVIEW_STATE_FILE_PATH ?? 'src/lib/admin/review-state.json';

function assertAdmin(locals: App.Locals) {
  const userEmail = locals.user?.email;
  if (!userEmail || userEmail !== env.ADMIN_EMAIL) {
    throw error(403, 'Forbidden');
  }
}

export const GET: RequestHandler = async ({ locals }) => {
  assertAdmin(locals);
  try {
    const { data } = await readJsonFile<ReviewState>(FILE_PATH);
    // Merge with empty state so new sections (vocab, uttrykk) always exist
    return json({ ...emptyReviewState(), ...data });
  } catch {
    // File missing on first run — return empty state
    return json(emptyReviewState());
  }
};

export const PUT: RequestHandler = async ({ locals, request }) => {
  assertAdmin(locals);
  const state: ReviewState = await request.json();

  let sha = '';
  try {
    ({ sha } = await readJsonFile<ReviewState>(FILE_PATH));
  } catch {
    // File doesn't exist yet — sha stays ''
  }

  const attempt = async (currentSha: string, retry = false): Promise<void> => {
    try {
      await writeJsonFile(FILE_PATH, state, currentSha, 'admin: update review state');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!retry && msg.includes('409')) {
        // SHA conflict: re-fetch and retry once
        try {
          const { sha } = await readJsonFile<ReviewState>(FILE_PATH);
          return attempt(sha, true);
        } catch {
          return attempt('', true);
        }
      }
      throw error(500, msg);
    }
  };

  await attempt(sha);
  return json({ ok: true });
};
