import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  target_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  ui_language: 'en' | 'nb';
  card_direction: 'no_en' | 'en_no';
  include_phrases: boolean;
  daily_reminder: boolean;
  email_lesson: boolean;
  // Lemon Squeezy fields — written by webhook only, never by client
  ls_customer_id: string | null;
  ls_subscription_id: string | null;
  ls_status: 'active' | 'paused' | 'cancelled' | 'expired' | null;
  ls_renews_at: string | null; // ISO date string
  ls_ends_at: string | null; // ISO date string
  updated_at: string;
}

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'display_name'
    | 'target_level'
    | 'ui_language'
    | 'card_direction'
    | 'include_phrases'
    | 'daily_reminder'
    | 'email_lesson'
  >
>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch the profile row for the given user.
 * Returns null if no row exists yet (first login before upsert).
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[profile] getProfile error:', error.message);
    return null;
  }

  return data as Profile | null;
}

/**
 * Create or update the profile row for the given user.
 * Safe to call on first login — upsert creates the row with defaults if absent.
 */
export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: ProfileUpdate
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) {
    console.error('[profile] upsertProfile error:', error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Delete the authenticated user's account.
 * Requires the Supabase service-role key — must only be called from a
 * trusted server context (form action or API route), never from the browser.
 *
 * Steps:
 *  1. Delete the auth.users row (cascades to profiles via FK).
 *  2. Caller is responsible for cancelling the Lemon Squeezy subscription
 *     before calling this function.
 */
export async function deleteAccount(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error('[profile] deleteAccount error:', error.message);
    return { error: error.message };
  }

  return { error: null };
}
