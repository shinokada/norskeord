/**
 * PATCH /api/profile/onboarding
 *
 * Accepts partial updates from the onboarding slides
 * (`OnboardingSlides.svelte`) and the post-snooze nudge fields on
 * `/my-profile` (`OnboardingFieldsSection.svelte`). Each slide/section PATCHes
 * only the field(s) it owns — any combination of the keys below may be sent
 * in a single request, including none (a no-op).
 *
 * Body (JSON), all keys optional:
 *   - display_name:         string | null  (trimmed, max 40 chars)
 *   - native_language:      string | null  (ISO 639-1 code)
 *   - other_languages:      string[]       (ISO 639-1 codes)
 *   - current_level:         'A1' | 'A2' | 'B1' | 'B2' | 'C' | null
 *   - study_goals:          string[]       (subset of vocab/grammar/speaking/listening/writing, max 3)
 *   - country:              string | null  (ISO 3166-1 alpha-2 code)
 *   - onboarding_done:      boolean
 *   - onboarding_snoozed_at: string | null (ISO timestamp)
 *
 * Response: { ok: true } | { message: string } (4xx/5xx)
 * Auth: requires a valid session cookie (locals.user).
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_GOALS = ['vocab', 'grammar', 'speaking', 'listening', 'writing'];
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'];
const VALID_FLASHCARD_LANGUAGES = new Set(['english', 'spanish', 'ukrainian']);
// ---------------------------------------------------------------------------
// Sanitisation helper — strips control characters and HTML-like content from
// free-text fields before they are stored. Svelte escapes on render so this
// won't prevent XSS on the site itself, but it keeps the DB clean.
// ---------------------------------------------------------------------------
function sanitizeText(val: string): string {
  return (
    val
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]/g, '') // control characters
      .replace(/[<>]/g, '') // no HTML angle brackets
      .trim()
  );
}

// Allowlists mirror the LANGUAGES / COUNTRIES arrays in OnboardingSlides.svelte.
// Kept here (rather than imported) so the API stays self-contained and can
// validate requests that bypass the UI entirely.

const VALID_LANG_CODES = new Set([
  'sq',
  'am',
  'ar',
  'zh',
  'da',
  'nl',
  'en',
  'fi',
  'fr',
  'de',
  'el',
  'hi',
  'id',
  'it',
  'ja',
  'kk',
  'ko',
  'ku',
  'lv',
  'lt',
  'ms',
  'ne',
  'nb',
  'fa',
  'pl',
  'pt',
  'ro',
  'ru',
  'si',
  'so',
  'es',
  'sv',
  'sw',
  'tl',
  'ta',
  'th',
  'ti',
  'tr',
  'uk',
  'ur',
  'vi'
]);

const VALID_COUNTRY_CODES = new Set([
  'AF',
  'AL',
  'DZ',
  'AR',
  'AU',
  'AT',
  'BD',
  'BE',
  'BR',
  'CA',
  'CL',
  'CN',
  'CO',
  'HR',
  'CZ',
  'DK',
  'EG',
  'ER',
  'ET',
  'FI',
  'FR',
  'DE',
  'GH',
  'GR',
  'HU',
  'IN',
  'ID',
  'IQ',
  'IR',
  'IE',
  'IT',
  'JP',
  'KE',
  'KR',
  'LT',
  'LV',
  'MX',
  'MA',
  'NL',
  'NZ',
  'NG',
  'NO',
  'PK',
  'PH',
  'PL',
  'PT',
  'RO',
  'RU',
  'SA',
  'SO',
  'ZA',
  'ES',
  'LK',
  'SE',
  'CH',
  'SY',
  'TH',
  'TR',
  'UA',
  'GB',
  'US',
  'VN'
]);

export const PATCH: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401, { message: 'Unauthorized' });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    error(400, { message: 'Invalid JSON.' });
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    error(400, { message: 'Invalid request body.' });
  }

  const body = raw as Record<string, unknown>;

  // Build a safe allow-list of fields this endpoint may write
  const update: Record<string, unknown> = {};

  if ('display_name' in body) {
    const rawName = (body.display_name as string | null) ?? null;
    const name = rawName ? sanitizeText(rawName) : null;
    if (name && name.length > 40) error(422, { message: 'Display name too long.' });
    update.display_name = name || null;
  }

  if ('flashcard_language' in body) {
    const lang = body.flashcard_language as string | null;
    if (lang && !VALID_FLASHCARD_LANGUAGES.has(lang)) {
      error(422, { message: 'Invalid flashcard language.' });
    }
    update.flashcard_language = lang || 'english';
  }

  if ('native_language' in body) {
    const lang = body.native_language as string | null;
    if (!lang) {
      update.native_language = null;
    } else if (VALID_LANG_CODES.has(lang)) {
      // Known ISO 639-1 code — accept as-is
      update.native_language = lang;
    } else {
      // Free-text "Other" path — sanitize and cap length
      const cleaned = sanitizeText(lang);
      if (cleaned.length > 60) error(422, { message: 'Language name too long.' });
      update.native_language = cleaned || null;
    }
  }

  if ('other_languages' in body) {
    const langs = body.other_languages;
    if (!Array.isArray(langs)) error(422, { message: 'other_languages must be an array.' });
    // Only accept known ISO codes — no free-text in the multi-select
    update.other_languages = (langs as unknown[]).filter(
      (l): l is string => typeof l === 'string' && VALID_LANG_CODES.has(l)
    );
  }

  if ('current_level' in body) {
    const level = body.current_level as string | null;
    if (level && !VALID_LEVELS.includes(level)) error(422, { message: 'Invalid level.' });
    update.current_level = level || null;
  }

  if ('study_goals' in body) {
    const goals = body.study_goals;
    if (!Array.isArray(goals)) error(422, { message: 'study_goals must be an array.' });
    const filtered = (goals as unknown[]).filter(
      (g): g is string => typeof g === 'string' && VALID_GOALS.includes(g)
    );
    if (filtered.length > 3) error(422, { message: 'Maximum 3 study goals.' });
    update.study_goals = filtered;
  }

  if ('country' in body) {
    const c = body.country as string | null;
    if (c && !VALID_COUNTRY_CODES.has(c)) error(422, { message: 'Invalid country.' });
    update.country = c || null;
  }

  if ('onboarding_done' in body) {
    update.onboarding_done = Boolean(body.onboarding_done);
  }

  if ('onboarding_snoozed_at' in body) {
    const snoozedAt = body.onboarding_snoozed_at;
    if (snoozedAt !== null && typeof snoozedAt !== 'string') {
      error(422, { message: 'onboarding_snoozed_at must be a string or null.' });
    }
    update.onboarding_snoozed_at = snoozedAt ?? null;
  }

  if (Object.keys(update).length === 0) {
    return json({ ok: true }); // nothing to do
  }

  update.updated_at = new Date().toISOString();

  const { error: dbError } = await locals.supabase
    .from('profiles')
    .upsert({ id: locals.user.id, ...update }, { onConflict: 'id' });

  if (dbError) {
    console.error('[onboarding] upsert error:', dbError.message);
    error(500, { message: 'Failed to save. Please try again.' });
  }

  return json({ ok: true });
};
