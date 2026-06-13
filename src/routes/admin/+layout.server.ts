import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

/**
 * Auth guard for /admin and all sub-routes.
 * Only the single designated admin email may access anything under /admin.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const email = locals.user?.email;
  if (!email || email !== env.ADMIN_EMAIL) {
    throw redirect(303, '/auth/login');
  }
  return {};
};
