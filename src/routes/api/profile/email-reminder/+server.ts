/**
 * PATCH /api/profile/email-reminder
 *
 * Enables or disables the daily email reminder for the authenticated Plus user.
 * Writes `profiles.email_reminder` in Supabase.
 *
 * Request body: { enabled: boolean }
 * Response:     { ok: true } | { error: string }
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (locals.plan !== 'plus') return json({ error: 'Plus only' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof (body as Record<string, unknown>).enabled !== 'boolean') {
    return json({ error: 'Missing required field: enabled (boolean)' }, { status: 400 });
  }

  const { enabled } = body as { enabled: boolean };

  const { error } = await locals.supabase
    .from('profiles')
    .update({ email_reminder: enabled })
    .eq('id', locals.user.id);

  if (error) {
    console.error('[email-reminder] update failed:', error.message);
    return json({ error: 'DB error' }, { status: 500 });
  }

  return json({ ok: true });
};
