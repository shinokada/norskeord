import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('$env/static/private', () => ({
  LEMONSQUEEZY_API_KEY: 'test-key',
  LEMONSQUEEZY_STORE_ID: 'store-1',
  LEMONSQUEEZY_VARIANT_ID: 'variant-month',
  LEMONSQUEEZY_VARIANT_ID_ANNUAL: 'variant-year'
}));

import { POST } from './+server';

const mockFetch = vi.fn();

function call(
  body: unknown,
  user: { id: string; email: string } | null = { id: 'u1', email: 'a@b.no' }
) {
  return POST({
    request: new Request('http://localhost/api/lemon/checkout', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),
    locals: { user },
    url: new URL('https://norskeord.no/api/lemon/checkout')
  } as never);
}

/** The attributes sent to the Lemon Squeezy API on the last call. */
function sentAttributes() {
  const init = mockFetch.mock.calls[0][1] as { body: string };
  return JSON.parse(init.body).data;
}

describe('POST /api/lemon/checkout', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // A fresh Response per call: a body can only be read once.
    mockFetch.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ data: { attributes: { url: 'https://ls.example/checkout' } } }),
          { status: 200 }
        )
    );
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 401 without a user', async () => {
    const res = await call({ interval: 'month' }, null);
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sets redirect_url to /plus/success?next=<next> for a safe next', async () => {
    const res = await call({ interval: 'month', next: '/a2/transport' });
    expect(res.status).toBe(200);
    expect((await res.json()).checkoutUrl).toBe('https://ls.example/checkout');
    expect(sentAttributes().attributes.product_options.redirect_url).toBe(
      'https://norskeord.no/plus/success?next=%2Fa2%2Ftransport'
    );
  });

  it('uses the plain success URL with no next, an unsafe next or no body', async () => {
    for (const body of [
      { interval: 'month' },
      { next: 'https://evil.com' },
      { next: '//evil.com' },
      'not json'
    ]) {
      mockFetch.mockClear();
      await call(body);
      expect(sentAttributes().attributes.product_options.redirect_url).toBe(
        'https://norskeord.no/plus/success'
      );
    }
  });

  it('still picks the annual variant when next is given', async () => {
    await call({ interval: 'year', next: '/b1/travel' });
    expect(sentAttributes().relationships.variant.data.id).toBe('variant-year');
  });
});
