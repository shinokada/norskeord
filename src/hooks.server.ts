import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { Handle } from '@sveltejs/kit';

/**
 * Runs on every server request.
 * Validates the Supabase session cookie and exposes:
 *   - locals.supabase  — authenticated server client for this request
 *   - locals.user      — the authenticated User object, or null
 *   - locals.plan      — 'plus' | 'free' (read from subscriptions table)
 */
const originalHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event.cookies);

  event.locals.supabase = supabase;

  // getUser() validates the JWT with Supabase's servers — never trust locals.session alone.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  event.locals.user = user ?? null;

  // Phase 3-A: read plan from subscriptions table.
  // Falls back to 'free' for unauthenticated users or missing rows.
  if (user) {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle();
    event.locals.plan = (data?.plan as 'free' | 'plus') ?? 'free';
  } else {
    event.locals.plan = 'free';
  }

  return resolve(event, {
    // Required by @supabase/ssr: let it set the auth cookie on the response.
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
};

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html
          .replace('%paraglide.lang%', locale)
          .replace('%paraglide.dir%', getTextDirection(locale))
    });
  });

export const handle = sequence(originalHandle, handleParaglide);
