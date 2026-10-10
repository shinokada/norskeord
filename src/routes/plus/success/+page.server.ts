import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { postPaymentDestination } from '$lib/post-payment';

export const load: PageServerLoad = ({ locals, url }) => {
  const destination = postPaymentDestination(url.searchParams.get('next'));

  // Redirect unauthenticated visitors to login and bring them back here, with
  // the page they came from still attached.
  if (!locals.user) {
    const back =
      destination === '/a1/greetings'
        ? '/plus/success'
        : `/plus/success?next=${encodeURIComponent(destination)}`;
    redirect(303, `/auth/login?next=${encodeURIComponent(back)}`);
  }
  // Don't gate on plan — the webhook is async and may not have fired yet.
  // The page polls /api/plan until the plan reads Plus.
  return { destination };
};
