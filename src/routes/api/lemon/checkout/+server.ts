/**
 * POST /api/lemon/checkout
 *
 * Creates a Lemon Squeezy checkout URL for the authenticated user.
 * Accepts an optional JSON body: { interval: 'month' | 'year' }
 * Defaults to 'month' if not provided or invalid.
 * Returns JSON { checkoutUrl: string } on success.
 *
 * Errors:
 *   401 { error: 'login_required' }   — user not authenticated
 *   500 { error: string }             — LS API failure
 */
import { json } from '@sveltejs/kit';
import {
  LEMONSQUEEZY_API_KEY,
  LEMONSQUEEZY_STORE_ID,
  LEMONSQUEEZY_VARIANT_ID,
  LEMONSQUEEZY_VARIANT_ID_ANNUAL
} from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  // 1. Require auth
  if (!locals.user) {
    return json({ error: 'login_required' }, { status: 401 });
  }

  // 2. Read optional interval from request body (default: 'month')
  let interval: 'month' | 'year' = 'month';
  try {
    const body = await request.json();
    if (body?.interval === 'year') interval = 'year';
  } catch {
    // no body or non-JSON — fall back to monthly
  }

  const variantId = interval === 'year' ? LEMONSQUEEZY_VARIANT_ID_ANNUAL : LEMONSQUEEZY_VARIANT_ID;

  const origin = url.origin;

  // 3. Create checkout via LS API
  let response: Response;
  try {
    response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json'
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              // Passed through to the webhook as meta.custom_data.user_id
              custom: { user_id: locals.user.id },
              // Pre-fill the buyer's email on the LS checkout form
              email: locals.user.email
            },
            product_options: {
              redirect_url: `${origin}/plus/success`
            }
          },
          relationships: {
            store: {
              data: { type: 'stores', id: LEMONSQUEEZY_STORE_ID }
            },
            variant: {
              data: { type: 'variants', id: variantId }
            }
          }
        }
      })
    });
  } catch (err) {
    console.error('[checkout] fetch failed:', err);
    return json({ error: 'Failed to reach payment provider' }, { status: 500 });
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('[checkout] LS API error:', response.status, body);
    return json({ error: 'Checkout creation failed' }, { status: 500 });
  }

  const data = await response.json();
  const checkoutUrl: string = data?.data?.attributes?.url;

  if (!checkoutUrl) {
    console.error('[checkout] No checkout URL in response:', JSON.stringify(data));
    return json({ error: 'No checkout URL returned' }, { status: 500 });
  }

  return json({ checkoutUrl });
};
