import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { chapterEntryBySlug } from '$lib/grammar/overview';

// Client-rendered like /grammar and /grammar/[topic]: progress comes from
// localStorage / Supabase on mount. See grammar-update.md, Phase 5.
export const ssr = false;

export const load: PageLoad = ({ params }) => {
  // Unknown slug, or a chapter with no topic yet (hidden in the map, decision
  // #18), is a 404. The ?level= scope is applied in the page, because a level
  // with no questions in this chapter is an empty state, not a 404.
  if (!chapterEntryBySlug(params.slug)) {
    throw error(404, 'Grammar chapter not found');
  }
  return { slug: params.slug };
};
