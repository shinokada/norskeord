import { defineConfig } from '@playwright/test';

export default defineConfig({
  // A single `vite preview` server backs every worker (see webServer below).
  // Running the full suite with the default worker count (≈ half the CPU
  // cores) overwhelms that one Node process under load, producing timing
  // flakes unrelated to the app itself (slow SSR responses, POST round-trips
  // exceeding their timeout, reactive UI updates landing after a poll already
  // read). Capping workers trades some wall-clock time for determinism.
  // workers: process.env.CI ? 2 : 4,
  workers: 2,
  webServer: {
    command: 'npm run search:index && npm run build && npm run preview',
    port: 4173,
    env: {
      ...process.env,
      // Force Cloudflare's dummy "always passes" Turnstile keys for e2e runs,
      // regardless of whatever real secret lives in .env. turnstile.ts reads
      // process.env directly (not $env/static/private), which bypasses Vite's
      // .env.local-overrides-.env layering — pre-existing process.env values
      // (set here, before `vite build`/`vite preview` start) take priority
      // over any .env file, so this reliably wins.
      // Docs: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
      PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA'
    }
  },

  testDir: 'e2e'
});
