import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { postPaymentDestination, successReturnPath } from '$lib/post-payment';

export const load: PageServerLoad = ({ locals, url }) => {
  const rawNext = url.searchParams.get('next');

  // Redirect unauthenticated visitors to login and bring them back here, with
  // the page they came from still attached (only when it is a usable `next`).
  if (!locals.user) {
    redirect(303, `/auth/login?next=${encodeURIComponent(successReturnPath(rawNext))}`);
  }
  // Don't gate on plan — the webhook is async and may not have fired yet.
  // The page polls /api/plan until the plan reads Plus.
  return { destination: postPaymentDestination(rawNext) };
};
