import { describe, it, expect } from 'vitest';
import { TRIAL_DAYS, deriveTrialFlags, trialDaysLeft, trialOffered, trialState } from './trial';

const NOW = new Date('2026-11-10T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs).toISOString();

describe('TRIAL_DAYS', () => {
  it('is 30', () => {
    expect(TRIAL_DAYS).toBe(30);
  });
});

describe('trialOffered', () => {
  it('offers the trial to a signed-out visitor', () => {
    expect(trialOffered({ user: null, trialEligible: false })).toBe(true);
    expect(trialOffered({})).toBe(true);
  });

  it('offers it to a signed-in user who can start one', () => {
    expect(trialOffered({ user: { id: 'u1' }, trialEligible: true })).toBe(true);
  });

  it('does not offer it to a signed-in user who already had a trial or paid', () => {
    expect(trialOffered({ user: { id: 'u1' }, trialEligible: false })).toBe(false);
    expect(trialOffered({ user: { id: 'u1' } })).toBe(false);
  });
});

describe('trialDaysLeft', () => {
  it('counts a full trial as 30 days', () => {
    expect(trialDaysLeft(at(30 * DAY), NOW)).toBe(30);
  });

  it('rounds partial days up', () => {
    expect(trialDaysLeft(at(25 * HOUR), NOW)).toBe(2);
    expect(trialDaysLeft(at(24 * HOUR), NOW)).toBe(1);
    expect(trialDaysLeft(at(23 * HOUR), NOW)).toBe(1);
  });

  it('is 1 on the last day, down to the last minute', () => {
    expect(trialDaysLeft(at(60 * 1000), NOW)).toBe(1);
    expect(trialDaysLeft(at(1), NOW)).toBe(1);
  });

  it('is 0 at the end and after it', () => {
    expect(trialDaysLeft(at(0), NOW)).toBe(0);
    expect(trialDaysLeft(at(-1), NOW)).toBe(0);
    expect(trialDaysLeft(at(-40 * DAY), NOW)).toBe(0);
  });

  it('is 0 for missing or invalid input', () => {
    expect(trialDaysLeft(null, NOW)).toBe(0);
    expect(trialDaysLeft(undefined, NOW)).toBe(0);
    expect(trialDaysLeft('', NOW)).toBe(0);
    expect(trialDaysLeft('not a date', NOW)).toBe(0);
  });

  it('accepts a Date and the Postgres timestamp format', () => {
    expect(trialDaysLeft(new Date(NOW.getTime() + 3 * DAY), NOW)).toBe(3);
    expect(trialDaysLeft('2026-11-13T12:00:00.123456+00:00', NOW)).toBe(4);
  });

  it('uses the current time when now is omitted', () => {
    expect(trialDaysLeft(new Date(Date.now() + 2 * DAY + HOUR))).toBe(3);
  });
});

describe('trialState', () => {
  it('is active for a Plus user with a future end', () => {
    expect(trialState('plus', at(5 * DAY), NOW)).toBe('active');
  });

  it('is ended for a free user with a past end', () => {
    expect(trialState('free', at(-DAY), NOW)).toBe('ended');
    expect(trialState('free', at(0), NOW)).toBe('ended');
  });

  it('is none without a trial end', () => {
    expect(trialState('free', null, NOW)).toBe('none');
    expect(trialState('plus', null, NOW)).toBe('none');
    expect(trialState('free', undefined, NOW)).toBe('none');
    expect(trialState('free', 'garbage', NOW)).toBe('none');
  });

  it('is none for combinations that should not happen', () => {
    expect(trialState('free', at(5 * DAY), NOW)).toBe('none');
    expect(trialState('plus', at(-DAY), NOW)).toBe('none');
  });
});

describe('deriveTrialFlags', () => {
  it('a signed-in user with no subscriptions row is eligible', () => {
    expect(deriveTrialFlags(null, 'free', true)).toEqual({
      trialEndsAt: null,
      trialEligible: true
    });
    expect(deriveTrialFlags(undefined, 'free', true).trialEligible).toBe(true);
  });

  it('a guest is never eligible', () => {
    expect(deriveTrialFlags(null, 'free', false)).toEqual({
      trialEndsAt: null,
      trialEligible: false
    });
  });

  it('a free row that never had a trial or a payment is eligible', () => {
    const row = { status: 'inactive', valid_until: null };
    expect(deriveTrialFlags(row, 'free', true).trialEligible).toBe(true);
  });

  it('a running trial has an end date and is not eligible', () => {
    const row = {
      status: 'trial',
      valid_until: '2026-12-01T04:51:25.562811+00:00',
      trial_started_at: '2026-11-01T04:51:25.562811+00:00'
    };
    expect(deriveTrialFlags(row, 'plus', true)).toEqual({
      trialEndsAt: '2026-12-01T04:51:25.562Z',
      trialEligible: false
    });
  });

  it('a lapsed trial keeps its (past) end date and is not eligible', () => {
    const row = {
      status: 'trial',
      valid_until: '2026-10-01T00:00:00+00:00',
      trial_started_at: '2026-09-01T00:00:00+00:00'
    };
    expect(deriveTrialFlags(row, 'free', true)).toEqual({
      trialEndsAt: '2026-10-01T00:00:00.000Z',
      trialEligible: false
    });
  });

  it('a user who has paid is not eligible and has no trial end', () => {
    const row = {
      status: 'active',
      valid_until: '2027-01-01T00:00:00+00:00',
      lemon_squeezy_subscription_id: '123',
      trial_started_at: '2026-09-01T00:00:00+00:00'
    };
    expect(deriveTrialFlags(row, 'plus', true)).toEqual({
      trialEndsAt: null,
      trialEligible: false
    });
  });

  it('a lapsed paid user is not eligible', () => {
    const row = {
      status: 'expired',
      valid_until: '2026-01-01T00:00:00+00:00',
      lemon_squeezy_subscription_id: '123'
    };
    expect(deriveTrialFlags(row, 'free', true).trialEligible).toBe(false);
  });

  it('a Plus user is not eligible', () => {
    const row = { status: 'active', valid_until: null };
    expect(deriveTrialFlags(row, 'plus', true).trialEligible).toBe(false);
  });

  it('a trial row with no valid_until has no end date', () => {
    const row = { status: 'trial', valid_until: null, trial_started_at: '2026-09-01T00:00:00Z' };
    expect(deriveTrialFlags(row, 'free', true).trialEndsAt).toBeNull();
  });
});
