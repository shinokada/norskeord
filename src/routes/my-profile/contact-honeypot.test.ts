import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal mocks — the supportContact action touches Supabase, Resend, and
// env vars. We mock all of them so the unit test is fast and self-contained.
// ---------------------------------------------------------------------------

// env vars
vi.mock('$env/static/private', () => ({
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  RESEND_API_KEY: 'test-resend-key',
  EMAIL_FROM: 'test@norskeord.no',
  ADMIN_USER_ID: 'admin-uuid-123',
  LEMONSQUEEZY_API_KEY: 'test-ls-key'
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
}));

// Supabase admin client used inside the action
const mockInsert = vi.fn();
const mockGetUserById = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert }),
    auth: { admin: { getUserById: mockGetUserById } }
  })
}));

// profile helper
vi.mock('$lib/server/profile', () => ({
  getProfile: vi.fn().mockResolvedValue({ display_name: 'Test User' })
}));

// Resend fetch — we mock global fetch so no real HTTP is made
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Import the action AFTER all mocks are in place
// ---------------------------------------------------------------------------

// We test the supportContact action logic directly by simulating what
// SvelteKit would pass to it, matching the pattern in waitlist/server.test.ts
import { actions } from './+page.server.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function makeLocals(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid-456', email: 'user@example.com' },
    plan: 'free',
    supabase: {},
    ...overrides
  };
}

function makeRequest(fields: Record<string, string>) {
  const fd = makeFormData(fields);
  return { formData: async () => fd, headers: new Headers() } as never;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('supportContact action — honeypot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockGetUserById.mockResolvedValue({ data: { user: { email: 'admin@norskeord.no' } } });
    mockFetch.mockResolvedValue({ ok: true, text: async () => '' });
  });

  it('silently succeeds when honeypot field is filled (bot submission)', async () => {
    const result = await actions.supportContact({
      request: makeRequest({
        subject: 'Bug report',
        message: 'This is a bot message that is long enough',
        app_version: '1.0.0',
        website: 'http://spam.example.com' // honeypot filled
      }),
      locals: makeLocals()
    } as never);

    // Should return success without calling DB or Resend
    expect(result).toEqual({ success: true, action: 'supportContact' });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does NOT treat a non-empty honeypot as a real message', async () => {
    await actions.supportContact({
      request: makeRequest({
        subject: 'Feature request',
        message: 'Please add dark mode to the app',
        app_version: '1.0.0',
        website: 'anything' // any non-empty value triggers honeypot
      }),
      locals: makeLocals()
    } as never);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('processes a real submission when honeypot is empty', async () => {
    const result = await actions.supportContact({
      request: makeRequest({
        subject: 'Bug report',
        message: 'The flashcard audio does not play on iOS',
        app_version: '1.0.0',
        website: '' // honeypot empty — real user
      }),
      locals: makeLocals()
    } as never);

    // DB insert and Resend should both be called for a real submission
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true, action: 'supportContact' });
  });

  it('processes a real submission when honeypot field is absent', async () => {
    // Real browsers submit the hidden field as empty string, but just in case
    // the field is missing entirely it should still be treated as legitimate
    const result = await actions.supportContact({
      request: makeRequest({
        subject: 'Other',
        message: 'Just a question about the subscription',
        app_version: '1.0.0'
        // no 'website' key at all
      }),
      locals: makeLocals()
    } as never);

    expect(mockInsert).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true, action: 'supportContact' });
  });
});
