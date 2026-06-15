import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

let clientUser = $state<User | null>(null);
let clientIsPlus = $state(false);
let initialized = $state(false);

export const authStore = {
  get user() {
    return clientUser;
  },
  get isPlus() {
    return clientIsPlus;
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
    initialized = true;
  },

  reset() {
    clientUser = null;
    clientIsPlus = false;
    initialized = false;
  }
};
