import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  // Redirect unauthenticated visitors away — they shouldn't land here.
  if (!locals.user) {
    redirect(303, '/auth/login');
  }
  // Don't gate on plan — the webhook is async and may not have fired yet.
};
