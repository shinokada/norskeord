import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────
// Same style as api/lemon/webhook/webhook.test.ts. $lib/trial and $lib/server/trial-email are
// pure and run for real, so the test also checks the claim key that reaches the database.

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn()
}));

vi.mock('$env/static/private', () => ({
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  TRIAL_CLAIM_SECRET: 'test-claim-secret'
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ rpc: mockRpc }))
}));

import { POST } from './+server';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ENDS_AT = '2026-12-01T04:51:25.562811+00:00';

type Locals = {
  user: { id: string; email?: string | null } | null;
  trialEligible: boolean;
};

function call(overrides: Partial<Locals> = {}) {
  const locals: Locals = {
    user: { id: 'user-1', email: 'anna@example.com' },
    trialEligible: true,
    ...overrides
  };
  return POST({ locals } as unknown as Parameters<typeof POST>[0]);
}

const NOT_AVAILABLE = { error: 'trial_not_available' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/trial/start', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: ENDS_AT, error: null });
  });

  it('returns 401 for a guest and does not call the database', async () => {
    const res = await call({ user: null });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'login_required' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 409 when hooks say the user is not eligible, without calling the database', async () => {
    const res = await call({ trialEligible: false });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(NOT_AVAILABLE);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 409 when the user has no email, without calling the database', async () => {
    const res = await call({ user: { id: 'user-1', email: null } });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(NOT_AVAILABLE);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 409 for a disposable domain, without calling the database', async () => {
    const res = await call({ user: { id: 'user-1', email: 'x@mailinator.com' } });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(NOT_AVAILABLE);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('starts the trial: calls start_trial with the user id, a hex key and 30 days', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ endsAt: ENDS_AT });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    const [fn, args] = mockRpc.mock.calls[0];
    expect(fn).toBe('start_trial');
    expect(args.p_user_id).toBe('user-1');
    expect(args.p_days).toBe(30);
    expect(args.p_email_key).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(args)).not.toContain('anna@example.com');
  });

  it('sends the same key for aliases of one Gmail mailbox', async () => {
    await call({ user: { id: 'user-1', email: 'ab@gmail.com' } });
    await call({ user: { id: 'user-2', email: 'A.B+trial2@googlemail.com' } });
    expect(mockRpc.mock.calls[0][1].p_email_key).toBe(mockRpc.mock.calls[1][1].p_email_key);
  });

  it('returns 409 with the same body when the database refuses (NULL)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const res = await call();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(NOT_AVAILABLE);
  });

  it('returns 500 when the database call fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const res = await call();
    expect(res.status).toBe(500);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
