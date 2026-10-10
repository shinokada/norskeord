import { getProfile } from '$lib/server/profile';
import { safeNext } from '$lib/safe-next';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const profile = locals.user ? await getProfile(locals.supabase, locals.user.id) : null;

  // Determine destination server-side so we can do a hard redirect,
  // which bypasses any stale edge-cached anonymous responses.
  // `next` comes from the query string, so only a same-origin path is accepted
  // (the client runs `window.location.href = destination`).
  const next = safeNext(url.searchParams.get('next'), '/');
  let destination = '/learn/a1';

  if (next !== '/') {
    destination = next;
  }
  // Note: "last-flashcard-path" from localStorage can't be read server-side,
  // so returning users without a `next` param fall back to /learn/a1.
  // The client can handle the localStorage restore after the redirect.

  return { profile, destination };
};
