import { sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { Handle } from '@sveltejs/kit';
// hooks.server.ts
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

// Derives "sb-<project-ref>-auth-token" from the Supabase URL.
// The project ref is already public — it's in the URL and visible in DevTools.
const projectRef = new URL(PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const SUPABASE_AUTH_COOKIE = `sb-${projectRef}-auth-token`;

/**
 * Runs on every server request.
 * Validates the Supabase session cookie and exposes:
 *   - locals.supabase  — authenticated server client for this request
 *   - locals.user      — the authenticated User object, or null
 *   - locals.plan      — 'plus' | 'free' (read from subscriptions table)
 *
 * Optimisation: if no auth cookie is present the Supabase network calls are
 * skipped entirely and we set Cache-Control on the response so Vercel's edge
 * can serve subsequent anonymous requests from cache.
 */
const originalHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event.cookies);
  event.locals.supabase = supabase;

  const hasSession = !!event.cookies.get(SUPABASE_AUTH_COOKIE);

  if (hasSession) {
    // getUser() validates the JWT with Supabase's servers — never trust the
    // cookie value alone.
    const {
      data: { user }
    } = await supabase.auth.getUser();

    event.locals.user = user ?? null;

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
  } else {
    // No session cookie — skip all Supabase network calls.
    event.locals.user = null;
    event.locals.plan = 'free';
  }

  const response = await resolve(event, {
    // Required by @supabase/ssr: let it set the auth cookie on the response.
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });

  // Allow Vercel's edge to cache anonymous GET responses for 5 minutes —
  // but ONLY for fully static/marketing pages where auth state doesn't affect
  // the rendered HTML (e.g. home, /plus, /resources, /blog/[slug]).
  //
  // Excluded:
  //   /api/*        — dynamic JSON endpoints
  //   /auth/*       — login / callback routes
  //   /learn/*      — hub pages show auth-sensitive UI (avatar, Plus badges)
  //   /blog         — blog index shows auth-sensitive nav
  //   /[level]/*    — flashcard pages are auth-gated
  //   /grammar/*    — grammar pages are auth-gated
  //   /quiz/*       — quiz pages are auth-gated
  //   /norskproven  — auth-gated
  //   /stats        — auth-required
  //   /my-profile   — auth-required
  const CACHE_EXCLUDED = [
    '/api/',
    '/auth/',
    '/learn/',
    '/grammar/',
    '/quiz',
    '/norskproven',
    '/stats',
    '/my-profile'
  ];
  const pathname = event.url.pathname;
  const isCacheExcluded =
    CACHE_EXCLUDED.some((prefix) => pathname.startsWith(prefix)) || pathname === '/blog'; // blog index (not individual posts)

  if (!hasSession && event.request.method === 'GET' && !isCacheExcluded) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  }

  return response;
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
