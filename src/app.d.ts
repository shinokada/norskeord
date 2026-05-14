import type { SupabaseClient, User } from '@supabase/supabase-js';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;
      plan: 'free' | 'plus';
      displayName: string | null;
    }
    interface PageData {
      user: User | null;
      plan: 'free' | 'plus';
      displayName: string | null;
    }
    // interface Error {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
