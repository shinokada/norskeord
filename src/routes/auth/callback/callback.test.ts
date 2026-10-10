import { describe, it, expect, vi, beforeEach } from 'vitest';

const exchangeCodeForSession = vi.fn();
vi.mock('$lib/server/supabase', () => ({
  createSupabaseServerClient: () => ({ auth: { exchangeCodeForSession } })
}));

import { GET } from './+server';

async function run(query: string) {
  const event = {
    url: new URL(`https://norskeord.no/auth/callback${query}`),
    cookies: {}
  } as unknown as Parameters<typeof GET>[0];
  try {
    await GET(event);
  } catch (e) {
    const r = e as { status?: number; location?: string };
    return { status: r.status, location: r.location };
  }
  throw new Error('expected a redirect');
}

beforeEach(() => {
  exchangeCodeForSession.mockReset();
});

describe('GET /auth/callback', () => {
  it('redirects to the login error when there is no code', async () => {
    const r = await run('');
    expect(r).toEqual({ status: 303, location: '/auth/login?error=auth_callback_failed' });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('redirects to the login error when the provider returns an error', async () => {
    const r = await run('?error=access_denied&code=abc');
    expect(r.location).toBe('/auth/login?error=auth_callback_failed');
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('keeps next on the error redirect', async () => {
    const r = await run('?next=%2Fa2%2Ftransport');
    expect(r.location).toBe('/auth/login?error=auth_callback_failed&next=%2Fa2%2Ftransport');
  });

  it('redirects to the login error when the exchange fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'bad', status: 400 } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await run('?code=abc');
    expect(r.location).toBe('/auth/login?error=auth_callback_failed');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('goes to /auth/sync with next on success', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const r = await run('?code=abc&next=%2Fa2%2Ftransport%3Fx%3D1');
    expect(r).toEqual({ status: 303, location: '/auth/sync?next=%2Fa2%2Ftransport%3Fx%3D1' });
  });

  it('falls back to / for an unsafe next', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const r = await run('?code=abc&next=https%3A%2F%2Fevil.example');
    expect(r.location).toBe('/auth/sync?next=%2F');
  });
});
