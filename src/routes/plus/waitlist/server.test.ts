import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request('http://localhost/plus/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function makeCookies() {
  return { getAll: () => [], setAll: () => {} } as never;
}

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockInsert = vi.fn();

vi.mock('$lib/server/supabase', () => ({
  createSupabaseServerClient: () => ({
    from: () => ({ insert: mockInsert })
  })
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /plus/waitlist', () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it('returns 400 when email is missing', async () => {
    const res = await POST({ request: makeRequest({}), cookies: makeCookies() } as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/valid email/i);
  });

  it('returns 400 when email is malformed', async () => {
    const res = await POST({
      request: makeRequest({ email: 'not-an-email' }),
      cookies: makeCookies()
    } as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/valid email/i);
  });

  it('returns 200 and success message on valid new email', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const res = await POST({
      request: makeRequest({ email: 'user@example.com' }),
      cookies: makeCookies()
    } as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Success');
  });

  it('returns 200 silently when email already exists (unique violation)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505' } });
    const res = await POST({
      request: makeRequest({ email: 'existing@example.com' }),
      cookies: makeCookies()
    } as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Success');
  });

  it('returns 500 on unexpected Supabase error', async () => {
    mockInsert.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } });
    const res = await POST({
      request: makeRequest({ email: 'user@example.com' }),
      cookies: makeCookies()
    } as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/something went wrong/i);
  });
});
