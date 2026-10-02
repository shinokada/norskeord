// /grammar is client-rendered: progress comes from localStorage / Supabase on
// mount. Everything else (the chapter map, counts, access state) is derived
// from taxonomy.ts + grammar-topic-index.json in $lib/grammar/overview.ts, so
// no question data is loaded here. See grammar-update.md, Phase 5.
export const ssr = false;
