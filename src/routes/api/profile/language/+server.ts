/**
 * PATCH /api/profile/language
 *
 * Lightweight endpoint used by the nav language toggle to persist the chosen
 * UI language to the user's profile without triggering a full page reload or
 * the redirect side-effect that lives in the `updatePreferences` form action.
 *
 * Body (JSON): { locale: 'en' | 'nb' }
 * Auth: requires a valid session cookie (locals.user).
 */
import { json } from '@sveltejs/kit';
import { upsertProfile } from '$lib/server/profile';
import { LANGUAGES } from '$lib/config';
import type { RequestHandler } from './$types';

const VALID_LOCALES = Object.values(LANGUAGES).map((l) => l.code);
type Locale = (typeof VALID_LOCALES)[number];

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorised' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const locale = (body as Record<string, unknown>)?.locale;
  if (!VALID_LOCALES.includes(locale as Locale)) {
    return json({ error: 'Invalid locale' }, { status: 422 });
  }

  const { error } = await upsertProfile(locals.supabase, locals.user.id, {
    ui_language: locale as Locale
  });

  if (error) {
    return json({ error: 'Failed to save' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
};
