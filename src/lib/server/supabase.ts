import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';

/**
 * Server-side Supabase client factory.
 * Call once per request inside handle() or load() — pass the event's cookies.
 * Uses the publishable key; RLS still applies.
 * For privileged operations (e.g. webhook handlers), use the service role key instead.
 */
export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });
}
