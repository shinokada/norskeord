import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { safeNext } from '$lib/safe-next';
import type { RequestHandler } from './$types';

/**
 * OAuth return point (Google). Supabase redirects here with `?code=…`; we
 * exchange it for a session (the PKCE verifier cookie was set by the `oauth`
 * action on /auth/login) and hand over to /auth/sync, exactly like the OTP path.
 * ai-docs/implementation/locked-teaser-social-login.md, Phase 2.
 */
export const GET: RequestHandler = async ({ url, cookies }) => {
  const next = safeNext(url.searchParams.get('next'));
  const failed = `/auth/login?error=auth_callback_failed${
    next !== '/' ? `&next=${encodeURIComponent(next)}` : ''
  }`;

  const code = url.searchParams.get('code');
  // The provider reports a denied consent screen etc. as `?error=…`.
  if (url.searchParams.get('error') || !code) {
    throw redirect(303, failed);
  }

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message, error.status);
    throw redirect(303, failed);
  }

  throw redirect(303, `/auth/sync?next=${encodeURIComponent(next)}`);
};
