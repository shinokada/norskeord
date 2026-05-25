import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './+server';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/profile/email-reminder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function makeInvalidRequest() {
  return new Request('http://localhost/api/profile/email-reminder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json {'
  });
}

// ── Locals factories ──────────────────────────────────────────────────────────

const mockUpdate = vi.fn();

function makeLocals(overrides?: { user?: unknown; plan?: string }) {
  return {
    user: overrides?.user !== undefined ? overrides.user : { id: 'user-123' },
    plan: overrides?.plan ?? 'plus',
    supabase: {
      from: () => ({
        update: () => ({
          eq: mockUpdate
        })
      })
    }
  } as never;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/profile/email-reminder', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  // ── Auth guards ─────────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    const res = await PATCH({
      request: makeRequest({ enabled: true }),
      locals: makeLocals({ user: null })
    } as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });

  it('returns 403 for free plan users', async () => {
    const res = await PATCH({
      request: makeRequest({ enabled: true }),
      locals: makeLocals({ plan: 'free' })
    } as never);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/plus only/i);
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it('returns 400 for invalid JSON body', async () => {
    const res = await PATCH({
      request: makeInvalidRequest(),
      locals: makeLocals()
    } as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid json/i);
  });

  it('returns 400 when enabled field is missing', async () => {
    const res = await PATCH({
      request: makeRequest({}),
      locals: makeLocals()
    } as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/enabled/i);
  });

  it('returns 400 when enabled is not a boolean', async () => {
    const res = await PATCH({
      request: makeRequest({ enabled: 'yes' }),
      locals: makeLocals()
    } as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/enabled/i);
  });

  // ── Success ─────────────────────────────────────────────────────────────────

  it('returns 200 when enabling email reminder', async () => {
    mockUpdate.mockResolvedValue({ error: null });
    const res = await PATCH({
      request: makeRequest({ enabled: true }),
      locals: makeLocals()
    } as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 200 when disabling email reminder', async () => {
    mockUpdate.mockResolvedValue({ error: null });
    const res = await PATCH({
      request: makeRequest({ enabled: false }),
      locals: makeLocals()
    } as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  // ── DB error ────────────────────────────────────────────────────────────────

  it('returns 500 on Supabase error', async () => {
    mockUpdate.mockResolvedValue({ error: { message: 'connection refused' } });
    const res = await PATCH({
      request: makeRequest({ enabled: true }),
      locals: makeLocals()
    } as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/db error/i);
  });
});
