/**
 * Review state for the admin editors.
 *
 * Tracks which grammar questions and blog posts have been manually reviewed
 * by the editor, independently of whether they were edited. Stored as a
 * sidecar JSON file in the repo so review progress persists across sessions
 * and devices.
 *
 * The file lives at REVIEW_STATE_PATH (default: src/lib/admin/review-state.json).
 * It is committed to the repo via the same GitHub Contents API used by the
 * content editors, but via its own lightweight endpoint so a "mark reviewed"
 * action never triggers a content redeploy.
 */

export interface ReviewEntry {
  checkedAt: string; // ISO date, e.g. '2026-06-13'
}

export interface ReviewState {
  grammar: Record<string, ReviewEntry>;
  blog: Record<string, ReviewEntry>;
}

export function emptyReviewState(): ReviewState {
  return { grammar: {}, blog: {} };
}

export type ReviewSection = keyof ReviewState;
