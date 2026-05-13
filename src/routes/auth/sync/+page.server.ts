import { getProfile } from '$lib/server/profile';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const profile = locals.user ? await getProfile(locals.supabase, locals.user.id) : null;
  return { profile };
};
