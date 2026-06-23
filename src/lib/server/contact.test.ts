import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal mocks — sendContactMessage touches Supabase, Resend, and env vars.
// We mock all of them so the unit test is fast and self-contained.
// ---------------------------------------------------------------------------

// env vars
vi.mock('$env/static/private', () => ({
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  RESEND_API_KEY: 'test-resend-key',
  EMAIL_FROM: 'test@norskeord.no',
  ADMIN_USER_ID: 'admin-uuid-123'
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
}));

// Supabase admin client used inside sendContactMessage
const mockInsert = vi.fn();
const mockGetUserById = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert }),
    auth: { admin: { getUserById: mockGetUserById } }
  })
}));

// Resend fetch — we mock global fetch so no real HTTP is made
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Import the shared helper AFTER all mocks are in place
// ---------------------------------------------------------------------------

import { sendContactMessage } from '$lib/server/contact.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePayload(overrides: Partial<Parameters<typeof sendContactMessage>[0]> = {}) {
  return {
    fromEmail: 'user@example.com',
    fromName: 'Test User',
    userId: 'user-uuid-456',
    plan: 'free' as const,
    subject: 'Bug report',
    message: 'The flashcard audio does not play on iOS',
    appVersion: '1.0.0',
    ip: '1.2.3.4',
    userAgent: 'Mozilla/5.0',
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Tests
// Note: Honeypot checking is now done in /contact/+page.server.ts before
// calling sendContactMessage. These tests cover the shared helper itself.
// ---------------------------------------------------------------------------

describe('sendContactMessage — shared contact helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockGetUserById.mockResolvedValue({ data: { user: { email: 'admin@norskeord.no' } } });
    mockFetch.mockResolvedValue({ ok: true, text: async () => '' });
  });

  it('inserts into DB and sends email for a free user', async () => {
    const result = await sendContactMessage(makePayload());

    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });

  it('includes [Plus Support] label in email subject for plus users', async () => {
    await sendContactMessage(makePayload({ plan: 'plus' }));

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.subject).toContain('[Plus Support]');
  });

  it('includes [Free Support] label in email subject for free users', async () => {
    await sendContactMessage(makePayload({ plan: 'free' }));

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.subject).toContain('[Free Support]');
  });

  it('sets reply_to to the sender email', async () => {
    await sendContactMessage(makePayload({ fromEmail: 'custom@example.com' }));

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.reply_to).toBe('custom@example.com');
  });

  it('returns error when admin email cannot be resolved', async () => {
    mockGetUserById.mockResolvedValue({ data: { user: null } });

    const result = await sendContactMessage(makePayload());

    expect(result).toEqual({ ok: false, error: 'contact_error_generic' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error when Resend call fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, text: async () => 'Bad Request' });

    const result = await sendContactMessage(makePayload());

    expect(result).toEqual({ ok: false, error: 'contact_error_generic' });
  });

  it('still attempts email even if DB insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const result = await sendContactMessage(makePayload());

    // Email should still be sent; result is ok as long as Resend succeeds
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
  });

  it('handles null userId (guest user)', async () => {
    const result = await sendContactMessage(makePayload({ userId: null }));

    expect(mockInsert).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true });
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.text).toContain('User ID: guest');
  });
});
