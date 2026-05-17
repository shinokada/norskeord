import { createSupabaseServerClient } from '$lib/server/supabase';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  // Must be logged in.
  if (!locals.user) throw redirect(303, '/auth/login');

  // Must be a Plus subscriber.
  if (locals.plan !== 'plus') throw redirect(303, '/plus');

  const { level, date } = params;
  const group = level.toUpperCase() as 'A' | 'B';

  if (!['A', 'B'].includes(group)) throw error(404, 'Not found');

  // Basic date format validation (YYYY-MM-DD).
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw error(404, 'Not found');

  const supabase = createSupabaseServerClient(cookies);
  const { data: lesson, error: err } = await supabase
    .from('daily_lessons')
    .select('*')
    .eq('level_group', group)
    .eq('lesson_date', date)
    .eq('approved', true)
    .single();

  if (err || !lesson) throw error(404, 'Lesson not found');

  return { lesson };
};
