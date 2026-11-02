/**
 * POST /api/trial/start
 *
 * Starts the 30-day Plus trial for the signed-in user
 * (ai-docs/implementation/free-trial.md). No body.
 *
 * Success: 200 { endsAt: string }  (ISO timestamp)
 *
 * Errors:
 *   401 { error: 'login_required' }      - not signed in
 *   409 { error: 'trial_not_available' } - every refusal gives this same answer, so an abuser
 *                                          does not learn which rule fired: the account is
 *                                          not eligible (had a trial, has paid, is Plus), the
 *                                          email is missing or disposable, or the email
 *                                          already had a trial
 *   500 { error: string }                - server or database failure
 *
 * The work is done by the `start_trial` SQL function (034_trial.sql) with the service role
 * client, like the Lemon Squeezy webhook. The email is reduced to a keyed hash first
 * ($lib/server/trial-email.ts), so no readable address is stored in `trial_claims`.
 */
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY, TRIAL_CLAIM_SECRET } from '$env/static/private';
import { TRIAL_DAYS } from '$lib/trial';
import { isDisposableEmail, trialEmailKey } from '$lib/server/trial-email';
import type { RequestHandler } from './$types';

const notAvailable = () => json({ error: 'trial_not_available' }, { status: 409 });

export const POST: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: 'login_required' }, { status: 401 });
  }

  // hooks.server.ts already worked out eligibility from the subscriptions row.
  if (!locals.trialEligible) return notAvailable();

  const email = user.email;
  if (!email || isDisposableEmail(email)) return notAvailable();

  let emailKey: string;
  try {
    emailKey = await trialEmailKey(email, TRIAL_CLAIM_SECRET);
  } catch (err) {
    console.error('[trial] could not compute the claim key:', err);
    return json({ error: 'Server error' }, { status: 500 });
  }

  // Service role client: start_trial is callable by service_role only.
  const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: endsAt, error } = await supabase.rpc('start_trial', {
    p_user_id: user.id,
    p_email_key: emailKey,
    p_days: TRIAL_DAYS
  });

  if (error) {
    console.error('[trial] start_trial failed:', error);
    return json({ error: 'DB error' }, { status: 500 });
  }

  // NULL: this email already had a trial, or the account is not eligible.
  if (!endsAt) return notAvailable();

  return json({ endsAt });
};
