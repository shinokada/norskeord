import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

// Old URL: /norskproven/practice/reading/[level]
// Redirect to new URL with test defaulting to 1
export const load: PageLoad = async ({ params }) => {
  redirect(302, `/norskproven/practice/1/reading/${params.level}`);
};
