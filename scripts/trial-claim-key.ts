/**
 * Prints the `trial_claims` key for an email address, so the owner can remove one claim
 * (ai-docs/implementation/free-trial.md: a real user who was refused a free trial by mistake).
 *
 * Usage:
 *   pnpm trial:claim-key someone@example.com
 *
 * Needs TRIAL_CLAIM_SECRET in .env, the same value as in Vercel. Prints the normalised address
 * and the key, then the SQL to run in the Supabase SQL editor. Nothing is written to the database.
 */
import { normalizeEmail, trialEmailKey } from '../src/lib/server/trial-email';

const email = process.argv[2];
const secret = process.env.TRIAL_CLAIM_SECRET ?? '';

if (!email) {
  console.error('Usage: pnpm trial:claim-key someone@example.com');
  process.exit(1);
}
if (!secret) {
  console.error('TRIAL_CLAIM_SECRET is not set. Add it to .env (same value as in Vercel).');
  process.exit(1);
}

const key = await trialEmailKey(email, secret);

console.log(`Normalised email: ${normalizeEmail(email)}`);
console.log(`Claim key:        ${key}`);
console.log('');
console.log('To allow this email a trial again, run in the Supabase SQL editor:');
console.log(`  delete from public.trial_claims where email_key = '${key}';`);
