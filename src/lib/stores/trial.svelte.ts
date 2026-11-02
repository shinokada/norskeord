/**
 * What the UI shows about the 30-day Plus trial: the Nav badge, the sidebar item and the
 * banner (ai-docs/implementation/free-trial.md, Phase 4).
 *
 * The trial end comes from the layout data for a signed-in page and from `authStore` (which reads
 * /api/plan) on prerendered pages, where `page.data.user` is null. The days left are worked out
 * in the browser, so the number is right after a page is cached or a tab stays open.
 */
import { browser } from '$app/environment';
import { page } from '$app/state';
import * as m from '$lib/paraglide/messages.js';
import { authStore } from '$lib/stores/auth.svelte';
import { trialDaysLeft, trialState, type Plan, type TrialState } from '$lib/trial';

// The browser clock as a timestamp (a number, not a Date: a Date inside $state is not reactive).
// It is null on the server on purpose: a module-level value would stay frozen at the time the
// server started, so the server reads the real time on every call.
let clockMs = $state<number | null>(browser ? Date.now() : null);

/** Call now and then (the banner does it every 10 minutes) so the days left stay current. */
export function refreshTrialClock(): void {
  if (browser) clockMs = Date.now();
}

function nowMs(): number {
  return clockMs ?? Date.now();
}

function trialEndsAt(): string | null {
  const value = page.data.user ? page.data.trialEndsAt : authStore.trialEndsAt;
  return typeof value === 'string' ? value : null;
}

function currentPlan(): Plan {
  const isPlus = page.data.user ? page.data.plan === 'plus' : authStore.isPlus;
  return isPlus ? 'plus' : 'free';
}

export const trialView = {
  /** The trial end as an ISO string (also after the end), or null when the user never had one. */
  get endsAt(): string | null {
    return trialEndsAt();
  },
  /** 'active' while a Plus trial is running; 'none' or 'ended' otherwise. */
  get state(): TrialState {
    return trialState(currentPlan(), trialEndsAt(), nowMs());
  },
  /** Whole days left, rounded up (1 means the last day). 0 when there is no running trial. */
  get daysLeft(): number {
    return trialDaysLeft(trialEndsAt(), nowMs());
  },
  /** "Trial: N days left", or "Last day of your trial" on the last day. */
  get badgeLabel(): string {
    const days = trialDaysLeft(trialEndsAt(), nowMs());
    return days <= 1 ? m.trial_nav_badge_last() : m.trial_nav_badge({ count: days });
  }
};
