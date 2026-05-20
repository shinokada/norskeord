import { redirect, fail } from '@sveltejs/kit';
import {
  SUPABASE_SERVICE_ROLE_KEY,
  LEMONSQUEEZY_API_KEY,
  RESEND_API_KEY,
  EMAIL_FROM,
  ADMIN_USER_ID
} from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { getProfile, upsertProfile, deleteAccount } from '$lib/server/profile';
import type { PageServerLoad, Actions } from './$types';
import type { ProfileUpdate } from '$lib/server/profile';

// ── Lemon Squeezy customer portal ────────────────────────────────────────────

/**
 * Fetches a Lemon Squeezy customer portal URL for the given subscription ID.
 * The portal URL is embedded in the subscription object's urls attribute.
 * Returns null on any failure so the UI degrades gracefully.
 */
async function fetchBillingPortalUrl(subscriptionId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
        Accept: 'application/vnd.api+json'
      }
    });
    if (!res.ok) {
      console.error('[billing-portal] LS API error:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return (data?.data?.attributes?.urls?.customer_portal as string) ?? null;
  } catch (err) {
    console.error('[billing-portal] fetch failed:', err);
    return null;
  }
}

// ── Load ─────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/auth/login');

  const profile = await getProfile(locals.supabase, locals.user.id);

  const isPlus = locals.plan === 'plus';

  // ls_customer_id lives in the subscriptions table (written by the LS webhook),
  // not in profiles. Look it up there for Plus users.
  let billingPortalUrl: string | null = null;
  if (isPlus) {
    const { data: sub } = await locals.supabase
      .from('subscriptions')
      .select('lemon_squeezy_subscription_id')
      .eq('user_id', locals.user.id)
      .maybeSingle();
    const subscriptionId = sub?.lemon_squeezy_subscription_id ?? null;
    if (subscriptionId) {
      billingPortalUrl = await fetchBillingPortalUrl(subscriptionId);
    }
  }

  return {
    profile,
    billingPortalUrl,
    user: locals.user,
    plan: locals.plan
  };
};

// ── Actions ──────────────────────────────────────────────────────────────────

export const actions: Actions = {
  updateAccount: async ({ request, locals }) => {
    if (!locals.user) redirect(302, '/auth/login');

    const data = await request.formData();
    const display_name = (data.get('display_name') as string | null)?.trim() ?? null;

    if (display_name && display_name.length > 40) {
      return fail(422, {
        field: 'display_name',
        message: 'Display name must be 40 characters or fewer.'
      });
    }

    const { error } = await upsertProfile(locals.supabase, locals.user.id, { display_name });
    if (error) {
      return fail(500, { field: 'display_name', message: 'Failed to save. Please try again.' });
    }

    return { success: true, action: 'updateAccount' };
  },

  updatePreferences: async ({ request, locals }) => {
    if (!locals.user) redirect(302, '/auth/login');

    const data = await request.formData();

    const target_level = data.get('target_level') as ProfileUpdate['target_level'];
    const ui_language = data.get('ui_language') as ProfileUpdate['ui_language'];
    const card_direction = data.get('card_direction') as ProfileUpdate['card_direction'];
    // card_type radio: 'word' | 'phrase' → stored as include_phrases boolean
    const card_type = data.get('card_type') as string | null;
    const include_phrases = card_type === 'phrase';
    const voice_speed_raw = data.get('voice_speed') as string | null;
    const voice_pitch_raw = data.get('voice_pitch') as string | null;
    const voice_speed = voice_speed_raw ? parseFloat(voice_speed_raw) : null;
    const voice_pitch = voice_pitch_raw ? parseFloat(voice_pitch_raw) : null;
    const session_limit_raw = data.get('session_limit') as string | null;
    const session_limit =
      session_limit_raw === null || session_limit_raw === 'all'
        ? null
        : parseInt(session_limit_raw, 10);
    const quiz_limit_raw = data.get('quiz_limit') as string | null;
    const quiz_limit =
      quiz_limit_raw === null || quiz_limit_raw === 'default' ? null : parseInt(quiz_limit_raw, 10);

    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const validLanguages = ['en', 'nb'];
    const validDirections = ['no_en', 'en_no'];
    const validCardTypes = ['word', 'phrase'];
    const validSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const validPitches = [0.7, 1.0, 1.3];
    const validLimits = [10, 20, 30, 50, null];
    const validQuizLimits = [5, 10, 15, 20, null];

    if (target_level && !validLevels.includes(target_level)) {
      return fail(422, { field: 'target_level', message: 'Invalid level.' });
    }
    if (ui_language && !validLanguages.includes(ui_language)) {
      return fail(422, { field: 'ui_language', message: 'Invalid language.' });
    }
    if (card_direction && !validDirections.includes(card_direction)) {
      return fail(422, { field: 'card_direction', message: 'Invalid card direction.' });
    }
    if (card_type && !validCardTypes.includes(card_type)) {
      return fail(422, { field: 'card_type', message: 'Invalid card type.' });
    }
    if (voice_speed !== null && !validSpeeds.includes(voice_speed)) {
      return fail(422, { field: 'voice_speed', message: 'Invalid speed.' });
    }
    if (voice_pitch !== null && !validPitches.includes(voice_pitch)) {
      return fail(422, { field: 'voice_pitch', message: 'Invalid tone.' });
    }
    if (!validLimits.includes(session_limit)) {
      return fail(422, { field: 'session_limit', message: 'Invalid session limit.' });
    }
    if (!validQuizLimits.includes(quiz_limit)) {
      return fail(422, { field: 'quiz_limit', message: 'Invalid quiz limit.' });
    }

    const update: ProfileUpdate = {
      ...(target_level && { target_level }),
      ...(ui_language && { ui_language }),
      ...(card_direction && { card_direction }),
      include_phrases,
      ...(voice_speed !== null && { voice_speed }),
      ...(voice_pitch !== null && { voice_pitch }),
      session_limit,
      quiz_limit
    };

    const { error } = await upsertProfile(locals.supabase, locals.user.id, update);
    if (error) {
      return fail(500, { field: 'preferences', message: 'Failed to save. Please try again.' });
    }

    if (ui_language === 'nb') {
      redirect(302, '/nb/my-profile');
    }

    return { success: true, action: 'updatePreferences' };
  },

  deleteAccount: async ({ locals }) => {
    if (!locals.user) redirect(302, '/auth/login');

    const userId = locals.user.id;

    // Cancel LS subscription before deleting the user.
    const { data: sub } = await locals.supabase
      .from('subscriptions')
      .select('lemon_squeezy_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (sub?.lemon_squeezy_subscription_id) {
      try {
        const res = await fetch(
          `https://api.lemonsqueezy.com/v1/subscriptions/${sub.lemon_squeezy_subscription_id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
              Accept: 'application/vnd.api+json'
            }
          }
        );
        if (!res.ok && res.status !== 404) {
          // 404 = already cancelled/doesn't exist, safe to proceed
          const body = await res.text();
          console.error('[delete-account] LS cancel failed:', res.status, body);
          return fail(500, {
            field: 'deleteAccount',
            message: 'Failed to cancel your subscription. Please try again or contact support.'
          });
        }
      } catch (err) {
        console.error('[delete-account] LS cancel error:', err);
        return fail(500, {
          field: 'deleteAccount',
          message: 'Failed to cancel your subscription. Please try again or contact support.'
        });
      }
    }

    const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await deleteAccount(supabaseAdmin, userId);

    if (error) {
      return fail(500, {
        field: 'deleteAccount',
        message: 'Failed to delete account. Please try again or contact support.'
      });
    }

    redirect(302, '/?deleted=1');
  },

  toggleEmail: async ({ locals }) => {
    if (!locals.user) redirect(302, '/auth/login');
    if (locals.plan !== 'plus')
      return fail(403, { field: 'toggleEmail', message: 'Plus required.' });

    const profile = await getProfile(locals.supabase, locals.user.id);
    const next = !(profile?.email_lesson ?? false);

    // 1. Update the profile flag so the UI reflects the preference.
    const { error: profileErr } = await upsertProfile(locals.supabase, locals.user.id, {
      email_lesson: next
    });
    if (profileErr) {
      return fail(500, { field: 'toggleEmail', message: 'Failed to save. Please try again.' });
    }

    // 2. Keep email_subscribers in sync.
    if (next) {
      // Subscribe: upsert a row with the user's current level.
      const level = profile?.target_level ?? 'A1';
      const { error: subErr } = await locals.supabase
        .from('email_subscribers')
        .upsert({ user_id: locals.user.id, level, active: true }, { onConflict: 'user_id' });
      if (subErr) {
        console.error('[toggleEmail] upsert subscriber failed:', subErr.message);
      }
    } else {
      // Unsubscribe: mark inactive (preserves the row for audit/re-subscribe).
      const { error: subErr } = await locals.supabase
        .from('email_subscribers')
        .update({ active: false })
        .eq('user_id', locals.user.id);
      if (subErr) {
        console.error('[toggleEmail] deactivate subscriber failed:', subErr.message);
      }
    }

    return { success: true, action: 'toggleEmail', emailLesson: next };
  },

  supportContact: async ({ request, locals }) => {
    if (!locals.user) redirect(302, '/auth/login');
    if (locals.plan !== 'plus')
      return fail(403, { field: 'supportContact', message: 'Plus required.' });

    const data = await request.formData();
    const subject = ((data.get('subject') as string) ?? '').trim();
    const message = ((data.get('message') as string) ?? '').trim();
    const appVersion = ((data.get('app_version') as string) ?? '').trim();

    if (!subject) return fail(422, { field: 'supportContact', message: 'Please enter a subject.' });
    if (message.length < 10)
      return fail(422, {
        field: 'supportContact',
        message: 'Please enter a message (at least 10 characters).'
      });
    if (message.length > 2000)
      return fail(422, {
        field: 'supportContact',
        message: 'Message is too long (max 2000 characters).'
      });

    const profile = await getProfile(locals.supabase, locals.user.id);
    const fromName = profile?.display_name ?? 'A Plus member';
    const fromEmail = locals.user.email ?? 'unknown';

    // Look up ADMIN_USER_ID's email to send to
    const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: adminData } = await supabaseAdmin.auth.admin.getUserById(ADMIN_USER_ID);
    const adminEmail = adminData?.user?.email;

    if (!adminEmail) {
      console.error('[supportContact] Could not resolve admin email');
      return fail(500, {
        field: 'supportContact',
        message: 'Could not send message. Please try again.'
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: adminEmail,
        reply_to: fromEmail,
        subject: `[Plus Support] ${subject}`,
        text: `From: ${fromName} <${fromEmail}>\nUser ID: ${locals.user.id}\nApp version: ${appVersion || 'unknown'}\n\n${message}`
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[supportContact] Resend error:', res.status, body);
      return fail(500, {
        field: 'supportContact',
        message: 'Failed to send message. Please try again.'
      });
    }

    return { success: true, action: 'supportContact' };
  }
};
