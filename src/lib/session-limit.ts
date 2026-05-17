/**
 * Returns the user's preferred session card limit.
 *
 * - No entry saved   → 20  (matches the UI default shown in Profile)
 * - Saved as 'all'   → null (no limit — show all cards)
 * - Saved as number  → that number
 */
export const LS_SESSION_LIMIT = 'vocab-flashcard-session-limit';

export function getSessionLimit(storage: Pick<Storage, 'getItem'>): number | null {
  const saved = storage.getItem(LS_SESSION_LIMIT);
  if (!saved) return 20;
  if (saved === 'all') return null;
  const n = parseInt(saved, 10);
  return isNaN(n) ? 20 : n;
}
