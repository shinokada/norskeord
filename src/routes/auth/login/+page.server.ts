import { fail } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { verifyTurnstileToken } from '$lib/server/turnstile';
import type { Actions } from './$types';

export const actions: Actions = {
  login: async ({ request, cookies, getClientAddress }) => {
    const data = await request.formData();
    const email = (data.get('email') as string | null)?.trim() ?? '';
    const turnstileToken = (data.get('cf-turnstile-response') as string | null) ?? '';
    const next = (data.get('next') as string | null) ?? '/';

    // --- Basic email validation ---
    if (!email) {
      return fail(400, { error: 'login_error_empty', email });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, { error: 'login_error_invalid', email });
    }

    // --- Turnstile verification ---
    let clientIp: string | undefined;
    try {
      clientIp = getClientAddress();
    } catch {
      // getClientAddress() throws if the adapter doesn't provide it; safe to ignore.
    }

    const turnstileOk = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileOk) {
      return fail(400, { error: 'login_error_bot_check', email });
    }

    // --- Send magic link via Supabase ---
    const supabase = createSupabaseServerClient(cookies);
    const origin = request.headers.get('origin') ?? '';
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (authError) {
      // Surface a generic error rather than leaking Supabase internals.
      return fail(500, { error: 'login_error_generic', email });
    }

    return { success: true, email };
  }
};
