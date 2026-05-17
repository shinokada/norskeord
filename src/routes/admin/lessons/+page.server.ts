import { createClient } from '@supabase/supabase-js';
import { redirect, error } from '@sveltejs/kit';
import { ADMIN_USER_ID, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { PageServerLoad, Actions } from './$types';

// Use the service role client so we bypass RLS and can read/write daily_lessons freely.
function adminClient() {
  return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (locals.user.id !== ADMIN_USER_ID) throw error(403, 'Forbidden');

  const supabase = adminClient();
  const { data: lessons, error: err } = await supabase
    .from('daily_lessons')
    .select('*')
    .order('lesson_date', { ascending: true })
    .order('level_group', { ascending: true });

  if (err) throw error(500, err.message);

  return { lessons: lessons ?? [] };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    if (!locals.user || locals.user.id !== ADMIN_USER_ID) throw error(403, 'Forbidden');
    const supabase = adminClient();
    const data = await request.formData();
    const id = data.get('id') as string;
    const { error: err } = await supabase
      .from('daily_lessons')
      .update({ approved: true })
      .eq('id', id);
    if (err) throw error(500, err.message);
  },

  reject: async ({ request, locals }) => {
    if (!locals.user || locals.user.id !== ADMIN_USER_ID) throw error(403, 'Forbidden');
    const supabase = adminClient();
    const data = await request.formData();
    const id = data.get('id') as string;
    const { error: err } = await supabase.from('daily_lessons').delete().eq('id', id);
    if (err) throw error(500, err.message);
  },

  update: async ({ request, locals }) => {
    if (!locals.user || locals.user.id !== ADMIN_USER_ID) throw error(403, 'Forbidden');
    const supabase = adminClient();
    const data = await request.formData();
    const id = data.get('id') as string;
    const focus_topic = data.get('focus_topic') as string;
    const main_text = data.get('main_text') as string;
    const vocabularyRaw = data.get('vocabulary') as string;
    const exercisesRaw = data.get('exercises') as string;

    let vocabulary, exercises;
    try {
      vocabulary = JSON.parse(vocabularyRaw);
      exercises = JSON.parse(exercisesRaw);
    } catch {
      throw error(400, 'Invalid JSON in vocabulary or exercises');
    }

    const lesson_date = data.get('lesson_date') as string;

    // Check for date conflicts (same level_group + date already exists on a different row).
    if (lesson_date) {
      const level_group = data.get('level_group') as string;
      const { data: conflict } = await supabase
        .from('daily_lessons')
        .select('id')
        .eq('level_group', level_group)
        .eq('lesson_date', lesson_date)
        .neq('id', id)
        .maybeSingle();
      if (conflict) throw error(409, `A ${level_group} lesson already exists for ${lesson_date}`);
    }

    const { error: err } = await supabase
      .from('daily_lessons')
      .update({
        focus_topic,
        main_text,
        vocabulary,
        exercises,
        ...(lesson_date ? { lesson_date } : {})
      })
      .eq('id', id);
    if (err) throw error(500, err.message);

    return { success: true };
  }
};
