/**
 * Review state for the admin editors.
 *
 * Tracks which grammar questions, blog posts, vocab entries, and uttrykk
 * entries have been manually reviewed by the editor, independently of whether
 * they were edited. Stored as a sidecar JSON file in the repo so review
 * progress persists across sessions and devices.
 *
 * The file lives at REVIEW_STATE_PATH (default: src/lib/admin/review-state.json).
 * It is committed to the repo via the same GitHub Contents API used by the
 * content editors, but via its own lightweight endpoint so a "mark reviewed"
 * action never triggers a content redeploy.
 *
 * Vocab / uttrykk keys: the entry's `id` field (e.g. "v-a1-greetings-001",
 * "u-a1-001", "u-a1-preview-001"). Entries created before the id migration
 * (scripts/add-vocab-uttrykk-ids.mjs) may lack an id; the admin pages fall
 * back to `${level}:${norsk}` (vocab) or `${level}:${deckType}:${norsk}`
 * (uttrykk) for those.
 */

export interface ReviewEntry {
  checkedAt: string; // ISO date, e.g. '2026-06-13'
}

export interface ReviewState {
  grammar: Record<string, ReviewEntry>;
  blog: Record<string, ReviewEntry>;
  vocab: Record<string, ReviewEntry>;
  uttrykk: Record<string, ReviewEntry>;
}

export function emptyReviewState(): ReviewState {
  return { grammar: {}, blog: {}, vocab: {}, uttrykk: {} };
}

export type ReviewSection = keyof ReviewState;
