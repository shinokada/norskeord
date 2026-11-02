/**
 * The 30-day Plus trial (ai-docs/implementation/free-trial.md).
 *
 * Pure helpers, no I/O, safe on the server and in the browser.
 *
 * A trial is a `subscriptions` row with plan = 'plus', status = 'trial' and a future
 * valid_until. After the end the row is unchanged: `hooks.server.ts` computes
 * plan = 'free' because valid_until is in the past, and `trialEndsAt` keeps the past date.
 * That past date is how the client knows to show the end-of-trial message.
 */

export const TRIAL_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type Plan = 'free' | 'plus';

/**
 * 'none'   - no trial to show (never had one, or the user has paid since)
 * 'active' - a Plus trial is running
 * 'ended'  - the trial is over and the user is free again
 */
export type TrialState = 'none' | 'active' | 'ended';

/** The columns of `subscriptions` that decide the trial flags. */
export interface TrialRow {
  status?: string | null;
  valid_until?: string | null;
  trial_started_at?: string | null;
  lemon_squeezy_subscription_id?: string | null;
}

function toMs(value: string | Date | null | undefined): number | null {
  if (value == null || value === '') return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** `now` as milliseconds: callers may pass a Date or a timestamp (Date.now()). */
function nowToMs(now: Date | number): number {
  return typeof now === 'number' ? now : now.getTime();
}

/**
 * Whole days left, rounded up, never below 0. 25 hours left is 2 days, 1 minute left is 1
 * day (the last day), a past or invalid date is 0. Display only: the server decides access.
 */
export function trialDaysLeft(
  endsAt: string | Date | null | undefined,
  now: Date | number = new Date()
): number {
  const end = toMs(endsAt);
  if (end === null) return 0;
  const remaining = end - nowToMs(now);
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / DAY_MS);
}

export function trialState(
  plan: Plan,
  trialEndsAt: string | null | undefined,
  now: Date | number = new Date()
): TrialState {
  const end = toMs(trialEndsAt);
  if (end === null) return 'none';
  const nowMs = nowToMs(now);
  if (plan === 'plus' && end > nowMs) return 'active';
  if (plan === 'free' && end <= nowMs) return 'ended';
  return 'none';
}

/**
 * The two flags `hooks.server.ts` puts on `locals`, from the user's `subscriptions` row.
 *
 * trialEndsAt    - ISO string while the row has status 'trial' (also after the end), else null.
 *                  A paid row has another status, so paying clears it.
 * trialEligible  - the same rule as the guard in the `start_trial` SQL function: the user is
 *                  signed in, is not Plus right now, never had a trial and never paid. A user with
 *                  no row is eligible. The server can still refuse (email already claimed).
 *
 * `plan` is the computed `locals.plan`, not the raw column.
 */
export function deriveTrialFlags(
  row: TrialRow | null | undefined,
  plan: Plan,
  signedIn: boolean
): { trialEndsAt: string | null; trialEligible: boolean } {
  const end = row?.status === 'trial' ? toMs(row.valid_until) : null;
  return {
    trialEndsAt: end === null ? null : new Date(end).toISOString(),
    trialEligible:
      signedIn && plan === 'free' && !row?.trial_started_at && !row?.lemon_squeezy_subscription_id
  };
}
