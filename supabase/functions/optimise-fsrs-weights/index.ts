/**
 * Edge Function: optimise-fsrs-weights
 *
 * Save this file to:
 *   supabase/functions/optimise-fsrs-weights/index.ts
 *
 * Then deploy with:
 *   npx supabase functions deploy optimise-fsrs-weights
 *
 * Triggered by the client (progress.ts → maybeTriggerOptimisation) when a user
 * crosses a 1,000-review milestone. Analyses the user's full card_progress data
 * to derive personalised FSRS weights, then upserts them into
 * user_settings.fsrs_weights.
 *
 * Optimisation schedule (enforced client-side before calling this function):
 *   0–999    → default weights, no call made
 *   1,000    → first optimisation
 *   +1,000 up to 5,000  → re-optimise
 *   5,000+   → re-optimise every +5,000
 *
 * Note: ts-fsrs v5 does not ship a standalone optimizer. Instead we analyse the
 * distribution of stability and difficulty values across the user's reviewed
 * cards to derive personalised priors for w[0]–w[4]. w[5]–w[20] retain FSRS5
 * defaults (they control decay/recall shape and require gradient descent to tune
 * safely). A full optimizer (e.g. Python fsrs-optimizer via pg_cron) can
 * replace this later when traffic justifies it (~5,000+ reviews per user).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { default_w } from 'https://esm.sh/ts-fsrs@5.3.2';

// ── Types mirroring the card_progress table columns ──────────────────────────

interface CardProgressRow {
  norsk: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0=New 1=Learning 2=Review 3=Relearning
  last_review: string | null;
}

// ── Weight derivation ─────────────────────────────────────────────────────────

/**
 * Derive a personalised 21-element FSRS weight vector from the user's reviewed
 * card corpus.
 *
 * What gets personalised:
 *   w[0]–w[3]  Initial stability per grade (Again / Hard / Good / Easy).
 *              Proxied from the median stability of cards bucketed by their
 *              inferred first-rating grade (we don't store individual rating
 *              events, only the final card state, so we use stability quartiles
 *              as a proxy).
 *   w[4]       Initial difficulty — mean difficulty across all reviewed cards.
 *
 * What stays at defaults:
 *   w[5]–w[20] FSRS5 decay / recall-shape parameters. These require full
 *              gradient descent over timestamped rating sequences to tune
 *              safely; the defaults are well-validated across millions of users.
 */
function deriveWeights(rows: CardProgressRow[]): number[] {
  // Start from a mutable copy of the 21 default weights.
  const weights: number[] = [...(default_w as readonly number[])];

  // Only consider cards that have been reviewed at least once.
  const reviewed = rows.filter((r) => r.reps > 0 && r.last_review !== null);

  if (reviewed.length < 10) {
    // Not enough signal — return defaults unchanged.
    return weights;
  }

  // Bucket cards by stability quartile as a proxy for the initial grade.
  // Cards first rated Again tend to have very low stability; Easy tend high.
  const stabilityByBucket: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
  const difficulties: number[] = [];

  for (const row of reviewed) {
    // Guard against degenerate values from corrupted rows.
    const s = Math.max(0.1, row.stability);
    const d = Math.min(10, Math.max(1, row.difficulty));
    difficulties.push(d);

    if (s < 0.5)
      stabilityByBucket[1].push(s); // Again-like
    else if (s < 2)
      stabilityByBucket[2].push(s); // Hard-like
    else if (s < 8)
      stabilityByBucket[3].push(s); // Good-like
    else stabilityByBucket[4].push(s); // Easy-like
  }

  // w[0]–w[3]: initial stability per grade (Again=0, Hard=1, Good=2, Easy=3).
  for (let grade = 1; grade <= 4; grade++) {
    const bucket = stabilityByBucket[grade];
    if (bucket.length >= 3) {
      const sorted = [...bucket].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      // Clamp to sane range for initial stability: [0.1, 100].
      weights[grade - 1] = Math.min(100, Math.max(0.1, median));
    }
  }

  // w[4]: initial difficulty — mean across all reviewed cards.
  if (difficulties.length >= 3) {
    const meanD = difficulties.reduce((a, b) => a + b, 0) / difficulties.length;
    weights[4] = Math.min(10, Math.max(1, meanD));
  }

  return weights;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Only accept POST requests.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let userId: string;
  try {
    const body = await req.json();
    userId = body.user_id;
    if (!userId || typeof userId !== 'string') throw new Error('Missing user_id');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Use the secret key so we can read any user's data server-side.
  // SUPABASE_URL and SUPABASE_SECRET_KEYS are injected automatically
  // by Supabase for all Edge Functions — no manual env setup needed.
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const serviceKey = secretKeys['default'];

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Pull the user's full card history from card_progress.
  const { data: rows, error: fetchError } = await supabase
    .from('card_progress')
    .select(
      'norsk, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review'
    )
    .eq('user_id', userId);

  if (fetchError) {
    console.error('Failed to fetch card_progress:', fetchError);
    return new Response(JSON.stringify({ error: 'Failed to fetch review history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ skipped: true, reason: 'No reviews found' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Derive personalised weights from the corpus.
  const optimisedWeights = deriveWeights(rows as CardProgressRow[]);

  // 3. Upsert the weights into user_settings.
  const { error: upsertError } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      fsrs_weights: optimisedWeights,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    console.error('Failed to upsert user_settings:', upsertError);
    return new Response(JSON.stringify({ error: 'Failed to save weights' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log(`[optimise-fsrs-weights] user=${userId} cards_analysed=${rows.length}`);

  return new Response(
    JSON.stringify({
      ok: true,
      user_id: userId,
      weights: optimisedWeights,
      cards_analysed: rows.length
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
