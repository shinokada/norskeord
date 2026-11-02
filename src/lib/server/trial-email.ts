/**
 * Email helpers for the free-trial abuse limits
 * (ai-docs/implementation/free-trial.md, decision 9).
 *
 * Pure: no `$env` and no `$lib` imports, so the Vitest tests and `scripts/trial-claim-key.ts`
 * can use it directly. Uses WebCrypto (`crypto.subtle`), as `verifyLemonSqueezyWebhook` does.
 */
import { DISPOSABLE_DOMAINS } from './disposable-domains';

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

/**
 * The mailbox an address really delivers to, so that aliases of one mailbox count once:
 * trim and lowercase; remove a `+tag` from the local part (every domain); for `gmail.com` and
 * `googlemail.com` also remove the dots in the local part and use `gmail.com`.
 *
 * Only the claim key uses this value. The account's email is never changed. A value that is
 * not an address (no `@`) is returned trimmed and lowercased.
 */
export function normalizeEmail(email: string): string {
  const value = email.trim().toLowerCase();
  const parts = splitEmail(value);
  if (!parts) return value;

  let { local, domain } = parts;
  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);

  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') local = local.replaceAll('.', '');

  return `${local}@${domain}`;
}

/** True when the address is on a throwaway-mailbox domain (or a subdomain of one). */
export function isDisposableEmail(email: string): boolean {
  const parts = splitEmail(email.trim().toLowerCase());
  if (!parts) return false;
  return DISPOSABLE_DOMAINS.some(
    (blocked) => parts.domain === blocked || parts.domain.endsWith(`.${blocked}`)
  );
}

/**
 * The key stored in `trial_claims.email_key`: the hex HMAC-SHA-256 of the normalised email with
 * the server secret `TRIAL_CLAIM_SECRET`. One-way, and useless without the secret. The secret
 * must never change: a new secret makes every stored key stop matching.
 */
export async function trialEmailKey(email: string, secret: string): Promise<string> {
  if (!secret) throw new Error('TRIAL_CLAIM_SECRET is not set');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(normalizeEmail(email)));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
