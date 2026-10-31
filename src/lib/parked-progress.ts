import {
  CLOZE_LS_PREFIX,
  GRAMMAR_LS_PREFIX,
  LS_PREFIX,
  QUIZ_LS_PREFIX,
  clearUserProgress
} from '$lib/progress';

// Parked progress (ai-docs/implementation/logout-progress-parking.md).
//
// At logout the four local progress stores are moved into one blob per store and account
// (`parked:<userId>:<store>`). No loader reads that prefix, so a guest or another account
// never sees parked data. At the next login of the same account the blobs are merged back
// into the live keys, so a failed free to Plus migration is retried and a free user keeps
// their progress. Nothing here touches Supabase, and no function throws.

/** Prefix of every parked blob. Not one of the four live prefixes, so no loader reads it. */
export const PARKED_PREFIX = 'parked:';

/**
 * Who the live progress keys belong to, written at login. Must not start with a live prefix:
 * `progress-owner` would be loaded as a vocab entry by `loadProgressMap`.
 */
export const LIVE_OWNER_KEY = 'live-owner';

/** A parked blob older than this is deleted. */
export const PARKED_MAX_AGE_DAYS = 90;

const BLOB_VERSION = 1;
const DAY_MS = 86_400_000;

export type ParkedStore = 'progress' | 'grammar' | 'quiz' | 'cloze';

/** `fsrs` entries are CardProgress (merge by `lastSeen`); `counts` are QuizStat (sum). */
type MergeKind = 'fsrs' | 'counts';

interface StoreSpec {
  name: ParkedStore;
  prefix: string;
  kind: MergeKind;
}

const STORES: readonly StoreSpec[] = [
  { name: 'progress', prefix: LS_PREFIX, kind: 'fsrs' },
  { name: 'grammar', prefix: GRAMMAR_LS_PREFIX, kind: 'fsrs' },
  { name: 'quiz', prefix: QUIZ_LS_PREFIX, kind: 'counts' },
  { name: 'cloze', prefix: CLOZE_LS_PREFIX, kind: 'counts' }
];

export interface ParkResult {
  /** Live keys moved into a parked blob. */
  parked: number;
  /** Stores whose blob could not be written (their live keys were removed anyway). */
  failed: ParkedStore[];
}

interface ParkedBlob {
  parkedAt: string;
  entries: Map<string, string>;
}

// ── localStorage helpers (never throw) ───────────────────────────────────────

function parkedKey(userId: string, store: ParkedStore): string {
  return `${PARKED_PREFIX}${userId}:${store}`;
}

/** A snapshot of the matching keys, so removing while looping cannot skip an entry. */
function keysWithPrefix(prefix: string): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(prefix)) keys.push(key);
    }
  } catch (error) {
    console.error('parked-progress: localStorage unavailable', error);
  }
  return keys;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing more can be done
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRecord(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Milliseconds for an ISO string, or -Infinity when it is missing or does not parse. */
function timeOf(value: unknown): number {
  if (typeof value !== 'string') return -Infinity;
  const t = Date.parse(value);
  return Number.isNaN(t) ? -Infinity : t;
}

// ── Merge ────────────────────────────────────────────────────────────────────

/**
 * Combines two raw entries stored under the same key. `live` is preferred whenever either
 * side does not parse.
 *
 * - fsrs: the entry with the later `lastSeen` wins (a tie keeps `live`).
 * - counts: `attempts` and `correct` are added and the later `lastAttempt` is kept, the same
 *   rule `migrateLocalStats` uses. Not idempotent, so callers delete a blob right after
 *   writing it back.
 */
function mergeRaw(kind: MergeKind, live: string, parked: string): string {
  const l = parseRecord(live);
  const p = parseRecord(parked);
  if (!l || !p) return live;

  if (kind === 'fsrs') {
    return timeOf(p.lastSeen) > timeOf(l.lastSeen) ? parked : live;
  }

  const la = l.attempts;
  const lc = l.correct;
  const pa = p.attempts;
  const pc = p.correct;
  if (
    typeof la !== 'number' ||
    typeof lc !== 'number' ||
    typeof pa !== 'number' ||
    typeof pc !== 'number' ||
    ![la, lc, pa, pc].every(Number.isFinite)
  ) {
    return live;
  }
  const lastAttempt = timeOf(p.lastAttempt) > timeOf(l.lastAttempt) ? p.lastAttempt : l.lastAttempt;
  return JSON.stringify({ ...l, attempts: la + pa, correct: lc + pc, lastAttempt });
}

// ── Blobs ────────────────────────────────────────────────────────────────────

function readBlob(key: string): ParkedBlob | null {
  const raw = safeGet(key);
  if (raw === null) return null;
  const parsed = parseRecord(raw);
  if (!parsed || parsed.v !== BLOB_VERSION || !isRecord(parsed.entries)) return null;

  const entries = new Map<string, string>();
  for (const [suffix, value] of Object.entries(parsed.entries)) {
    if (typeof value === 'string') entries.set(suffix, value);
  }
  return { parkedAt: typeof parsed.parkedAt === 'string' ? parsed.parkedAt : '', entries };
}

function writeBlob(key: string, blob: ParkedBlob): void {
  localStorage.setItem(
    key,
    JSON.stringify({
      v: BLOB_VERSION,
      parkedAt: blob.parkedAt,
      entries: Object.fromEntries(blob.entries)
    })
  );
}

// ── Park ─────────────────────────────────────────────────────────────────────

/**
 * Moves one store's live keys into its blob. A blob left from an earlier logout that was
 * never restored is merged with, not overwritten. If the blob cannot be written (quota) the
 * live keys are still removed: another person must not read them, and that is the rule the
 * old logout followed.
 */
function parkStore(userId: string, spec: StoreSpec, now: Date): { moved: number; failed: boolean } {
  const liveKeys = keysWithPrefix(spec.prefix);
  if (liveKeys.length === 0) return { moved: 0, failed: false };

  const blobKey = parkedKey(userId, spec.name);
  const entries = readBlob(blobKey)?.entries ?? new Map<string, string>();

  let moved = 0;
  for (const key of liveKeys) {
    const raw = safeGet(key);
    if (raw === null) continue;
    const suffix = key.slice(spec.prefix.length);
    const earlier = entries.get(suffix);
    entries.set(suffix, earlier === undefined ? raw : mergeRaw(spec.kind, raw, earlier));
    moved++;
  }

  let failed = false;
  try {
    writeBlob(blobKey, { parkedAt: now.toISOString(), entries });
  } catch (error) {
    failed = true;
    moved = 0;
    console.error(`parked-progress: could not park the ${spec.name} store`, error);
  }
  for (const key of liveKeys) safeRemove(key);
  return { moved, failed };
}

function parkLiveKeys(userId: string, now: Date): ParkResult {
  const result: ParkResult = { parked: 0, failed: [] };
  if (!userId) return result;
  for (const spec of STORES) {
    const { moved, failed } = parkStore(userId, spec, now);
    result.parked += moved;
    if (failed) result.failed.push(spec.name);
  }
  return result;
}

/**
 * Logout: moves the account's live progress into parked blobs and clears the owner marker.
 * Also deletes expired blobs. Stores with no keys write no blob.
 */
export function parkUserProgress(userId: string, now: Date = new Date()): ParkResult {
  purgeExpiredParkedProgress(now);
  const result = parkLiveKeys(userId, now);
  safeRemove(LIVE_OWNER_KEY);
  return result;
}

/**
 * What the logout button calls. Parks under the session's user id; when that is missing (for
 * example the auth store is not initialised yet) it falls back to the account recorded in
 * `live-owner`, so the keys are not left readable. With neither, nothing is parked and null
 * is returned, as the old logout did for a missing id.
 */
export function parkForLogout(
  sessionUserId: string | null | undefined,
  now: Date = new Date()
): ParkResult | null {
  const userId = sessionUserId || safeGet(LIVE_OWNER_KEY);
  if (!userId) return null;
  return parkUserProgress(userId, now);
}

// ── Restore ──────────────────────────────────────────────────────────────────

function restoreStore(userId: string, spec: StoreSpec): number {
  const blobKey = parkedKey(userId, spec.name);
  const blob = readBlob(blobKey);
  if (!blob) return 0;

  let restored = 0;
  let allWritten = true;
  for (const [suffix, parked] of blob.entries) {
    const key = spec.prefix + suffix;
    const live = safeGet(key);
    try {
      localStorage.setItem(key, live === null ? parked : mergeRaw(spec.kind, live, parked));
      restored++;
    } catch (error) {
      allWritten = false;
      console.error(`parked-progress: could not restore ${key}`, error);
    }
  }
  // Keep the blob if anything failed, so the data is not lost and the next login tries again.
  if (allWritten) safeRemove(blobKey);
  return restored;
}

/** Merges the account's parked blobs back into the live keys, then deletes them. */
export function restoreParkedProgress(userId: string): number {
  if (!userId) return 0;
  let restored = 0;
  for (const spec of STORES) restored += restoreStore(userId, spec);
  return restored;
}

// ── Purge ────────────────────────────────────────────────────────────────────

/** Deletes every parked blob of one account (progress reset, account deletion). */
export function purgeParkedProgress(userId: string): void {
  if (!userId) return;
  for (const key of keysWithPrefix(`${PARKED_PREFIX}${userId}:`)) safeRemove(key);
}

/**
 * Deletes parked blobs older than PARKED_MAX_AGE_DAYS, for every account. A blob that does
 * not parse, or has no valid `parkedAt`, counts as expired.
 */
export function purgeExpiredParkedProgress(now: Date = new Date()): void {
  const cutoff = now.getTime() - PARKED_MAX_AGE_DAYS * DAY_MS;
  for (const key of keysWithPrefix(PARKED_PREFIX)) {
    const blob = readBlob(key);
    const parkedAt = blob ? Date.parse(blob.parkedAt) : NaN;
    if (!(parkedAt >= cutoff)) safeRemove(key);
  }
}

// ── Login ────────────────────────────────────────────────────────────────────

/**
 * Login (auth/sync), before syncLocalProgressToPlus:
 *
 * 1. deletes expired blobs;
 * 2. if the live keys belong to another account (a session that expired without a logout),
 *    parks them under that account;
 * 3. restores this account's parked blobs;
 * 4. records this account as the owner of the live keys.
 *
 * Live keys with no owner are guest data and are adopted as they are, as before.
 */
export function adoptLiveProgress(userId: string, now: Date = new Date()): void {
  if (!userId) return;
  purgeExpiredParkedProgress(now);

  const owner = safeGet(LIVE_OWNER_KEY);
  if (owner && owner !== userId) parkLiveKeys(owner, now);

  restoreParkedProgress(userId);

  try {
    localStorage.setItem(LIVE_OWNER_KEY, userId);
  } catch (error) {
    console.error('parked-progress: could not record the owner', error);
  }
}

/** The account the live keys belong to, or null for guest data. */
export function getLiveOwner(): string | null {
  return safeGet(LIVE_OWNER_KEY);
}

/** Removes the owner marker (account deletion). */
export function clearLiveOwner(): void {
  safeRemove(LIVE_OWNER_KEY);
}

/**
 * Account deletion: removes the deleted account's live progress keys, its parked blobs and
 * the owner marker. The blobs are those of the session's user id, else of the `live-owner`
 * account (as `parkForLogout` does); another account's parked blobs are never touched.
 * Live keys are always cleared, since they are the deleted account's or guest data left
 * on this device, and the next login would otherwise adopt them.
 */
export function discardAccountProgress(sessionUserId: string | null | undefined): void {
  const userId = sessionUserId || safeGet(LIVE_OWNER_KEY);
  if (userId) purgeParkedProgress(userId);
  clearUserProgress();
  safeRemove(LIVE_OWNER_KEY);
}
