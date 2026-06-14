import type { LayoutServerLoad } from './$types';

// user and plan are already exported by the root +layout.server.ts.
// Do NOT re-export them here — re-exporting causes the child's __data.json
// to override the root layout's values, which breaks auth state when the
// child route's response is served from Vercel's edge cache (user: null).
export const load: LayoutServerLoad = async () => {
  return {};
};
