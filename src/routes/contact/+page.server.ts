import { fail } from '@sveltejs/kit';
import { verifyTurnstileToken } from '$lib/server/turnstile';
import { sendContactMessage } from '$lib/server/contact';
import { getProfile } from '$lib/server/profile';
import type { PageServerLoad, Actions } from './$types';

// ── Load ─────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return { userEmail: null, isPlus: false, displayName: null };
  }

  const profile = await getProfile(locals.supabase, locals.user.id);

  return {
    userEmail: locals.user.email ?? null,
    isPlus: locals.plan === 'plus',
    displayName: profile?.display_name ?? null
  };
};

// ── Actions ──────────────────────────────────────────────────────────────────

// Subject options kept in sync with the existing contact form subjects.
const VALID_SUBJECTS = [
  'Bug report',
  'Translation / content error',
  'Feature request',
  'Billing question',
  'Account issue',
  'Other'
];

export const actions: Actions = {
  send: async ({ request, locals, getClientAddress }) => {
    const data = await request.formData();

    const honeypot = (data.get('website') as string | null) ?? '';
    // Honeypot filled → silent success (bot)
    if (honeypot) {
      return { success: true };
    }

    const turnstileToken = (data.get('cf-turnstile-response') as string | null) ?? '';
    const subject = (data.get('subject') as string | null)?.trim() ?? '';
    const message = (data.get('message') as string | null)?.trim() ?? '';
    const appVersion = (data.get('app_version') as string | null) ?? '';

    // --- Turnstile verification ---
    let clientIp: string | undefined;
    try {
      clientIp = getClientAddress();
    } catch {
      // Safe to ignore — adapter may not provide it.
    }

    const turnstileOk = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileOk) {
      return fail(400, { error: 'contact_error_bot_check' });
    }

    // --- Validation ---
    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return fail(400, { error: 'contact_error_subject' });
    }
    if (message.length < 10 || message.length > 2000) {
      return fail(400, { error: 'contact_error_message' });
    }

    // For logged-in users, trust locals.user.email rather than any submitted field.
    let fromEmail: string;
    let fromName: string;
    let userId: string | null = null;
    let plan: 'free' | 'plus' = 'free';

    if (locals.user) {
      fromEmail = locals.user.email ?? '';
      fromName = 'Norskeord user';
      userId = locals.user.id;
      plan = locals.plan === 'plus' ? 'plus' : 'free';
    } else {
      const submittedEmail = (data.get('email') as string | null)?.trim() ?? '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail)) {
        return fail(400, { error: 'contact_error_email' });
      }
      fromEmail = submittedEmail;
      fromName = 'Guest';
    }

    if (!fromEmail) {
      return fail(400, { error: 'contact_error_email' });
    }

    const result = await sendContactMessage({
      fromEmail,
      fromName,
      userId,
      plan,
      subject,
      message,
      appVersion,
      ip: clientIp ?? null,
      userAgent: request.headers.get('user-agent')
    });

    if (!result.ok) {
      return fail(500, { error: result.error ?? 'contact_error_generic' });
    }

    return { success: true, email: fromEmail };
  }
};
