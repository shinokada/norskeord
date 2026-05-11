import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

/**
 * Handles the OAuth / magic-link callback from Supabase.
 * Supabase redirects here with ?code=... after the user clicks their sign-in link.
 * We exchange the code for a session, set the auth cookie, then redirect to
 * /auth/sync which triggers the localStorage → Supabase progress sync client-side.
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createSupabaseServerClient(cookies);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect via the sync page so the client can run syncProgressOnLogin
      // before continuing to the final destination.
      const syncUrl = new URL('/auth/sync', url.origin);
      syncUrl.searchParams.set('next', next);
      throw redirect(303, syncUrl.toString());
    }
  }

  // Code missing or exchange failed — send to login with an error hint.
  throw redirect(303, '/auth/login?error=auth_callback_failed');
};
