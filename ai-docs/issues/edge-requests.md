Now I can see the key issue. Let me check if there's prerendering configured:Now I have a clear picture. Let me check the `![-]/catchall` route and API routes to complete the analysis:I now have everything I need. Here's the complete diagnosis:

---

## Why norskeord has so many edge requests

Looking at the Vercel Observability screenshot, the top two routes account for the vast majority of traffic:

| Route                 | Requests | Cached |
| --------------------- | -------- | ------ |
| `/[level]/[category]` | 17K      | **0%** |
| `/![-]/catchall`      | 5.9K     | **0%** |

Both are at **0% cache**. This is the root cause — every single request hits a Vercel Edge Function.

### Root cause: `hooks.server.ts` runs on every request

```ts
// hooks.server.ts — runs on EVERY request, preventing any caching
const { data: { user } } = await supabase.auth.getUser(); // → network call to Supabase
const { data } = await supabase.from('subscriptions').select('plan')... // → DB query
```

Because `hooks.server.ts` calls Supabase on every request to validate the user and look up their subscription plan, **SvelteKit cannot prerender or cache anything** — every request must go through an Edge Function. This is correct for logged-in users, but for the anonymous public traffic hitting `/[level]/[category]` (vocab flashcard pages), it's completely unnecessary.

### Secondary cause: `+layout.server.ts` queries the DB on every page load

```ts
// +layout.server.ts — also queries profiles table on every request
const { data } = await locals.supabase
  .from('profiles')
  .select('display_name, target_level, session_limit, show_example')
  ...
```

For logged-in users this query runs on every page navigation.

### The `/![-]/catchall` route (5.9K requests)

This is likely SvelteKit's catch-all handling bad bot traffic or 404s — none of those are cached either.

---

## How to fix it

### Fix 1: Prerender the vocab deck pages (biggest win — eliminates the 17K edge requests)

The `/[level]/[category]` pages serve the same vocab data to everyone. The only user-specific thing is the Plus gating — but that can be handled client-side. Add `entries()` to make them prerenderable:

```ts
// src/routes/[level]/[category]/+page.server.ts
import { CATEGORIES_BY_LEVEL } from '$lib/types';

export const prerender = true; // add this

export function entries() {
  const levels = ['a1', 'a2', 'b1', 'b2'];
  const result = [];
  for (const level of levels) {
    const cats = CATEGORIES_BY_LEVEL[level.toUpperCase()] ?? [];
    for (const category of cats) {
      result.push({ level, category });
    }
  }
  return result;
}
```

However, the complication here is that your `+page.server.ts` uses `locals.plan` to gate Plus categories and build `visibleCats`. You have two options:

**Option A (simpler):** Split the page into two layers — prerender the vocab data (public), and handle Plus gating in the client with a `+page.ts` that checks `$page.data.plan`. This is what you did for flowbite-svelte.

**Option B (quick win without prerender):** Add aggressive caching headers for unauthenticated requests. In `hooks.server.ts`, skip the Supabase queries for unauthenticated requests (no session cookie), and set `Cache-Control` on the response:

```ts
// hooks.server.ts
const originalHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event.cookies);
  event.locals.supabase = supabase;

  // Only validate session if auth cookie is present
  const hasSession = event.cookies.get('sb-access-token') || 
                     event.cookies.get('sb-refresh-token');
  
  if (hasSession) {
    const { data: { user } } = await supabase.auth.getUser();
    event.locals.user = user ?? null;
    if (user) {
      const { data } = await supabase.from('subscriptions')
        .select('plan').eq('user_id', user.id).maybeSingle();
      event.locals.plan = (data?.plan as 'free' | 'plus') ?? 'free';
    } else {
      event.locals.plan = 'free';
    }
  } else {
    event.locals.user = null;
    event.locals.plan = 'free';
  }

  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });

  // Cache unauthenticated page responses at edge for 5 minutes
  if (!hasSession && event.request.method === 'GET' && 
      !event.url.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  }

  return response;
};
```

### Fix 2: Check which Supabase auth cookie name you're actually using

The cookie name depends on your Supabase project ref. Check it in DevTools — it's usually `sb-<project-ref>-auth-token`. Update the `hasSession` check accordingly, or use a more reliable check:

```ts
const hasSession = [...event.cookies.getAll()].some(c => c.name.includes('auth-token'));
```

### Fix 3: Add `vercel.json` headers for the vocab routes

```json
{
  "headers": [
    {
      "source": "/data/search-index.json",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(a1|a2|b1|b2|c)/:category",
      "headers": [{ "key": "Cache-Control", "value": "public, s-maxage=300, stale-while-revalidate=3600" }]
    }
  ]
}
```

---

## Summary

The core problem is the same one you solved for **flowbite-svelte**: dynamic routes with no prerendering and no caching, causing every request to spin up an Edge Function. The **biggest ROI fix** is to prerender `/[level]/[category]` with `entries()` (or at minimum add edge caching for anonymous requests by skipping Supabase calls when no auth cookie is present). That should cut your 17K edge requests down to near-zero for the vocab pages.


**Option A (prerender) is the better long-term solution**, but it's more invasive for norskeord than it was for flowbite-svelte. Here's the honest tradeoff:

**Option B is what you just implemented** (Fix 2 + Fix 3). It already gives you most of the benefit — anonymous requests skip Supabase entirely and get cached at the edge for 5 minutes. The remaining edge requests will only happen on cache misses.

**Option A would eliminate edge requests entirely** for vocab pages — the HTML is generated at build time and served as static files, zero compute per request. But it has real complications for norskeord specifically:

- The `+page.server.ts` currently uses `locals.plan` to decide whether to load the full uttrykk deck vs the preview deck, and to gate Plus-only categories. With prerender, `locals` doesn't exist — you'd have to move all of that logic to the client, meaning Plus users would briefly see the free/preview content until the client-side check runs.
- The `+layout.server.ts` also reads `locals.user` and `locals.plan` — that whole auth layer would need restructuring for prerendered routes.
- You'd need to export `entries()` covering all level+category combinations (not hard, but you'd need to enumerate them).

**My recommendation:** stick with what you've just deployed (Option B) and see how much it improves the numbers in Vercel Observability over the next day. If the cache hit rate is good (>80%), you probably don't need Option A. Option A is only worth the complexity if you need the absolute zero-compute guarantee — e.g. if traffic scales to a point where even cache misses are expensive.