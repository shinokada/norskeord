/**
 * POST /api/push/subscribe  — save a Web Push subscription (Plus only)
 * DELETE /api/push/subscribe — remove the subscription
 *
 * Stores/clears `push_subscription` in the profiles table and
 * toggles `daily_reminder` accordingly.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (locals.plan !== 'plus') return json({ error: 'Plus only' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { error } = await locals.supabase
    .from('profiles')
    .update({ push_subscription: body, daily_reminder: true })
    .eq('id', locals.user.id);

  if (error) {
    console.error('[push/subscribe] save failed:', error.message);
    return json({ error: 'DB error' }, { status: 500 });
  }

  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await locals.supabase
    .from('profiles')
    .update({ push_subscription: null, daily_reminder: false })
    .eq('id', locals.user.id);

  if (error) {
    console.error('[push/subscribe] delete failed:', error.message);
    return json({ error: 'DB error' }, { status: 500 });
  }

  return json({ ok: true });
};
