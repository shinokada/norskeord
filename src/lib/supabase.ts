import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

/**
 * Browser-side Supabase client.
 * Safe to import from .svelte files and client-side +page.ts loaders.
 * Uses the publishable (anon) key — RLS policies enforce access control.
 */
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
