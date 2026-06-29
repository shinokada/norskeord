import { fail, redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { verifyTurnstileToken } from '$lib/server/turnstile';
import type { Actions, PageServerLoad } from './$types';

const PENDING_COOKIE = 'login_pending_email';
const COOKIE_OPTS = {
  path: '/auth/login',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 30 // 30 minutes
} as const;

export const load: PageServerLoad = async ({ cookies }) => {
  // Read the pending email cookie so SSR can render the verify step
  // immediately — no client-side localStorage round-trip needed.
  const pendingEmail = cookies.get(PENDING_COOKIE) ?? '';
  return { pendingEmail };
};

export const actions: Actions = {
  clearPending: async ({ cookies }) => {
    cookies.delete(PENDING_COOKIE, { path: '/auth/login' });
    return {};
  },

  login: async ({ request, cookies, getClientAddress }) => {
    const data = await request.formData();
    const email = (data.get('email') as string | null)?.trim() ?? '';
    const turnstileToken = (data.get('cf-turnstile-response') as string | null) ?? '';
    const next = (data.get('next') as string | null) ?? '/';

    // --- Basic email validation ---
    if (!email) {
      return fail(400, { error: 'login_error_empty', email, next });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, { error: 'login_error_invalid', email, next });
    }

    // --- Turnstile verification ---
    // Skip Turnstile for resend requests (user already passed bot-check when
    // they first submitted their email; Supabase rate-limits resend anyway).
    const isResend = data.get('resend') === '1';

    let clientIp: string | undefined;
    try {
      clientIp = getClientAddress();
    } catch {
      // getClientAddress() throws if the adapter doesn't provide it; safe to ignore.
    }

    const turnstileOk = isResend || (await verifyTurnstileToken(turnstileToken, clientIp));
    if (!turnstileOk) {
      return fail(400, { error: 'login_error_bot_check', email, next });
    }

    // --- Send OTP via Supabase ---
    // Locale is read from the Paraglide cookie (no user session exists yet at
    // login time, so this is the only reliable locale signal available
    // server-side). It's passed through as user metadata so the Supabase OTP
    // email template can render the correct language.
    const locale = (cookies.get('PARAGLIDE_LOCALE') ?? 'en') as 'en' | 'nb' | 'es' | 'uk';

    const supabase = createSupabaseServerClient(cookies);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { locale }
      }
    });

    if (authError) {
      // Surface a generic error rather than leaking Supabase internals.
      return fail(500, { error: 'login_error_generic', email, next });
    }

    // Set a cookie so SSR can render the verify step on page reload
    // (Android PWA backgrounding causes a full page reload).
    cookies.set(PENDING_COOKIE, email, COOKIE_OPTS);

    return { success: true, email, next };
  },

  verify: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = (data.get('email') as string | null)?.trim() ?? '';
    const token = ((data.get('token') as string | null) ?? '').replace(/\s/g, '').trim();
    const next = (data.get('next') as string | null) ?? '/';

    if (!token || !/^\d{6}$/.test(token)) {
      return fail(400, { error: 'login_error_otp_invalid', email, next, step: 'verify' });
    }

    const supabase = createSupabaseServerClient(cookies);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

    if (error) {
      console.error('[verify] Supabase verifyOtp error:', error.message, error.status);
      return fail(400, { error: 'login_error_otp_invalid', email, next, step: 'verify' });
    }

    // Clear the pending email cookie on successful login.
    cookies.delete(PENDING_COOKIE, { path: '/auth/login' });

    throw redirect(303, `/auth/sync?next=${encodeURIComponent(next)}`);
  }
};
