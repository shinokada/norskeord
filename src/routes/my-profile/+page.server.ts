import { redirect, fail } from '@sveltejs/kit';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { getProfile, upsertProfile, deleteAccount } from '$lib/server/profile';
import type { PageServerLoad, Actions } from './$types';
import type { ProfileUpdate } from '$lib/server/profile';

// ── Load ─────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/auth/login');

  const profile = await getProfile(locals.supabase, locals.user.id);

  const billingPortalUrl: string | null = null;

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

    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const validLanguages = ['en', 'nb'];
    const validDirections = ['no_en', 'en_no'];
    const validCardTypes = ['word', 'phrase'];

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

    const update: ProfileUpdate = {
      ...(target_level && { target_level }),
      ...(ui_language && { ui_language }),
      ...(card_direction && { card_direction }),
      include_phrases
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

    // Phase 2-B: cancel LS subscription here before deleting the user.
    // const profile = await getProfile(locals.supabase, userId);
    // if (profile?.ls_subscription_id) {
    //   await cancelLemonSqueezySubscription(profile.ls_subscription_id);
    // }

    const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await deleteAccount(supabaseAdmin, userId);

    if (error) {
      return fail(500, {
        field: 'deleteAccount',
        message: 'Failed to delete account. Please try again or contact support.'
      });
    }

    redirect(302, '/?deleted=1');
  }
};
