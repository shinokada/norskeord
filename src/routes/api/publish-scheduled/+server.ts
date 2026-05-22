/**
 * GET /api/publish-scheduled
 *
 * Called daily by Vercel Cron at 06:00 UTC (vercel.json).
 * Triggers a new deployment via a Vercel Deploy Hook so that
 * any post whose publishedAt date has arrived goes live.
 *
 * Required env var:
 *   VERCEL_DEPLOY_HOOK_URL — the full deploy hook URL from
 *   Vercel Dashboard → Project → Settings → Git → Deploy Hooks
 *
 * The cron request from Vercel includes an Authorization header
 * with the value "Bearer <CRON_SECRET>". We verify it here so
 * the endpoint cannot be triggered by arbitrary HTTP requests.
 *
 * Required env var:
 *   CRON_SECRET — any random string; set the same value in
 *   Vercel Dashboard → Project → Settings → Environment Variables
 */

import { VERCEL_DEPLOY_HOOK_URL, CRON_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  // Verify the request is from Vercel Cron.
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const res = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });

    if (!res.ok) {
      const body = await res.text();
      console.error('[publish-scheduled] Deploy hook failed:', res.status, body);
      return new Response('Deploy hook failed', { status: 502 });
    }

    console.log('[publish-scheduled] Deploy triggered successfully.');
    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[publish-scheduled] Unexpected error:', err);
    return new Response('Internal error', { status: 500 });
  }
};
