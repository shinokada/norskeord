import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────
// vi.hoisted: vi.mock factories are hoisted above imports, so mock fns that
// the factories reference must be created via vi.hoisted to exist in time.

const { mockRpc, mockVerify } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockVerify: vi.fn()
}));

vi.mock('$env/static/private', () => ({
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  LEMONSQUEEZY_WEBHOOK_SECRET: 'test-webhook-secret'
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ rpc: mockRpc }))
}));

vi.mock('$lib/server/lemonsqueezy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/server/lemonsqueezy')>();
  return { ...actual, verifyLemonSqueezyWebhook: mockVerify };
});

import { POST } from './+server';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePayload(
  eventName: string,
  attrsOverrides: Record<string, unknown> = {},
  userId: string | null = 'user-123'
) {
  return {
    meta: {
      event_name: eventName,
      custom_data: userId ? { user_id: userId } : undefined
    },
    data: {
      id: 'sub-1',
      attributes: {
        order_id: 111,
        customer_id: 222,
        variant_id: 333,
        status: 'active',
        ends_at: null,
        billing_interval: 'month',
        updated_at: '2026-01-02T00:00:00.000Z',
        ...attrsOverrides
      }
    }
  };
}

function makeRequest(payload: unknown) {
  return new Request('http://localhost/api/lemon/webhook', {
    method: 'POST',
    headers: { 'X-Signature': 'test-signature' },
    body: JSON.stringify(payload)
  });
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/lemon/webhook', {
    method: 'POST',
    headers: { 'X-Signature': 'test-signature' },
    body: rawBody
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/lemon/webhook', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockVerify.mockReset();
    mockVerify.mockResolvedValue(true);
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  // ── Signature / parsing guards ───────────────────────────────────────────

  it('returns 401 for an invalid signature', async () => {
    mockVerify.mockResolvedValue(false);
    const res = await POST({
      request: makeRequest(makePayload('subscription_created'))
    } as never);
    expect(res.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST({ request: makeRawRequest('not json {') } as never);
    expect(res.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 400 when user_id is missing from custom_data', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST({
      request: makeRequest(makePayload('subscription_created', {}, null))
    } as never);
    expect(res.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // ── subscription_created / updated / activated ───────────────────────────

  it.each(['subscription_created', 'subscription_updated', 'subscription_activated'])(
    '%s: applies plan plus for an active status',
    async (eventName) => {
      const res = await POST({
        request: makeRequest(makePayload(eventName, { status: 'active' }))
      } as never);
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith(
        'upsert_subscription_if_newer',
        expect.objectContaining({
          p_user_id: 'user-123',
          p_plan: 'plus',
          p_status: 'active',
          p_billing_interval: 'month',
          p_valid_until: null,
          p_subscription_id: 'sub-1',
          p_customer_id: '222',
          p_order_id: '111',
          p_event_at: '2026-01-02T00:00:00.000Z'
        })
      );
    }
  );

  it('subscription_created: treats on_trial as active', async () => {
    await POST({
      request: makeRequest(makePayload('subscription_created', { status: 'on_trial' }))
    } as never);
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_subscription_if_newer',
      expect.objectContaining({ p_plan: 'plus', p_status: 'active' })
    );
  });

  it('subscription_created: downgrades to plan free when status is unpaid', async () => {
    await POST({
      request: makeRequest(makePayload('subscription_created', { status: 'unpaid' }))
    } as never);
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_subscription_if_newer',
      expect.objectContaining({ p_plan: 'free', p_status: 'past_due' })
    );
  });

  it('falls back to the current time when updated_at is missing', async () => {
    const before = Date.now();
    await POST({
      request: makeRequest(makePayload('subscription_created', { updated_at: undefined }))
    } as never);
    const call = mockRpc.mock.calls[0][1] as { p_event_at: string };
    expect(new Date(call.p_event_at).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('returns 500 when the RPC call errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: { message: 'connection refused' } });
    const res = await POST({
      request: makeRequest(makePayload('subscription_created'))
    } as never);
    expect(res.status).toBe(500);
    consoleSpy.mockRestore();
  });

  it('returns 200 but logs when the RPC skips a stale event', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await POST({
      request: makeRequest(makePayload('subscription_created'))
    } as never);
    expect(res.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/skipped stale event/i),
      'subscription_created',
      'sub-1'
    );
    consoleSpy.mockRestore();
  });

  // ── subscription_cancelled ────────────────────────────────────────────────

  it('subscription_cancelled: leaves plan/billing_interval untouched (null)', async () => {
    const res = await POST({
      request: makeRequest(
        makePayload('subscription_cancelled', { ends_at: '2026-02-01T00:00:00.000Z' })
      )
    } as never);
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_subscription_if_newer',
      expect.objectContaining({
        p_plan: null,
        p_billing_interval: null,
        p_status: 'cancelled',
        p_valid_until: '2026-02-01T00:00:00.000Z'
      })
    );
  });

  // ── subscription_expired ─────────────────────────────────────────────────

  it('subscription_expired: sets plan free and clears valid_until', async () => {
    const res = await POST({
      request: makeRequest(makePayload('subscription_expired'))
    } as never);
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_subscription_if_newer',
      expect.objectContaining({
        p_plan: 'free',
        p_status: 'expired',
        p_valid_until: null
      })
    );
  });

  // ── subscription_paused ───────────────────────────────────────────────────

  it('subscription_paused: leaves plan untouched and passes through ends_at', async () => {
    const res = await POST({
      request: makeRequest(
        makePayload('subscription_paused', { ends_at: '2026-03-01T00:00:00.000Z' })
      )
    } as never);
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      'upsert_subscription_if_newer',
      expect.objectContaining({
        p_plan: null,
        p_billing_interval: null,
        p_status: 'past_due',
        p_valid_until: '2026-03-01T00:00:00.000Z'
      })
    );
  });

  // ── subscription_resumed / unpaused ──────────────────────────────────────

  it.each(['subscription_resumed', 'subscription_unpaused'])(
    '%s: sets status active and leaves plan untouched',
    async (eventName) => {
      const res = await POST({
        request: makeRequest(makePayload(eventName, { ends_at: '2026-04-01T00:00:00.000Z' }))
      } as never);
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith(
        'upsert_subscription_if_newer',
        expect.objectContaining({
          p_status: 'active',
          p_plan: null,
          p_valid_until: '2026-04-01T00:00:00.000Z'
        })
      );
    }
  );

  // ── Unhandled events ──────────────────────────────────────────────────────

  it('returns 200 and does not write for unhandled events', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = await POST({
      request: makeRequest(makePayload('order_created'))
    } as never);
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
