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

/**
 * The limit a flashcard session actually uses.
 *
 * `profileValue` is the layout's `sessionLimit`:
 * - `undefined` → guest, or no profile row: use this device's localStorage value
 * - `null`      → the profile chose "All cards" (no limit)
 * - number      → that limit
 * A profile value always wins over localStorage, including `null`.
 */
export function resolveSessionLimit(
  profileValue: number | null | undefined,
  local: number | null
): number | null {
  return profileValue === undefined ? local : profileValue;
}

/**
 * Initial value of the "Cards per session" control on the profile page:
 * 'all' for a stored NULL, the stored number as a string, or '20' when there is no profile row.
 */
export function seedSessionLimit(profile: { session_limit: number | null } | null): string {
  if (!profile) return '20';
  return profile.session_limit === null ? 'all' : String(profile.session_limit);
}
