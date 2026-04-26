import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

/**
 * Signs the user out server-side and clears the auth cookie.
 * Called via a POST fetch from the Nav logout button.
 * Always redirects home, even if the user was already signed out.
 */
export const POST: RequestHandler = async ({ cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  await supabase.auth.signOut();
  throw redirect(303, '/');
};
