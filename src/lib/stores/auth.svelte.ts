import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

let clientUser = $state<User | null>(null);
let clientIsPlus = $state(false);
let clientTrialEndsAt = $state<string | null>(null);
let clientTrialEligible = $state(false);
let initialized = $state(false);

export const authStore = {
  get user() {
    return clientUser;
  },
  get isPlus() {
    return clientIsPlus;
  },
  // Trial flags from /api/plan (ai-docs/implementation/free-trial.md).
  get trialEndsAt() {
    return clientTrialEndsAt;
  },
  get trialEligible() {
    return clientTrialEligible;
  },
  get initialized() {
    return initialized;
  },

  async init() {
    if (initialized) return;
    const [{ data }, planRes] = await Promise.all([supabase.auth.getUser(), fetch('/api/plan')]);
    clientUser = data.user ?? null;
    const planJson = await planRes.json();
    clientIsPlus = planJson.plan === 'plus';
    clientTrialEndsAt = typeof planJson.trialEndsAt === 'string' ? planJson.trialEndsAt : null;
    clientTrialEligible = planJson.trialEligible === true;
    initialized = true;
  },

  reset() {
    clientUser = null;
    clientIsPlus = false;
    clientTrialEndsAt = null;
    clientTrialEligible = false;
    initialized = false;
  }
};
