import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import devtoolsJson from 'vite-plugin-devtools-json';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };
import sveltePackage from './node_modules/svelte/package.json' with { type: 'json' };
import svelteKitPackage from './node_modules/@sveltejs/kit/package.json' with { type: 'json' };
import vitePackage from './node_modules/vite/package.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      sveltekit(),
      tailwindcss(),
      devtoolsJson(),
      VitePWA({
        registerType: 'prompt',
        manifest: {
          name: 'Norske Flashcard',
          short_name: 'Norske',
          description: pkg.description,
          theme_color: '#1e3a5f',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },

            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },

            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns:
            mode === 'production' ? ['client/**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'] : [],
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        devOptions: { enabled: true, type: 'module' }
      }),
      paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' })
    ],
    define: {
      __VAPID_PUBLIC_KEY__: JSON.stringify(env.PUBLIC_VAPID_KEY ?? ''),
      __NAME__: JSON.stringify(pkg.name),
      __DESCRIPTION__: JSON.stringify(pkg.description),
      __VERSION__: JSON.stringify(pkg.version),
      __GITHUBURL__: JSON.stringify(pkg.repository.url),
      __SVELTE_VERSION__: JSON.stringify(sveltePackage.version),
      __SVELTEKIT_VERSION__: JSON.stringify(svelteKitPackage.version),
      __VITE_VERSION__: JSON.stringify(vitePackage.version)
    },
    test: {
      projects: [
        {
          extends: './vite.config.ts',
          plugins: [svelteTesting()],
          test: {
            name: 'client',
            environment: 'jsdom',
            clearMocks: true,
            include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
            exclude: ['src/lib/server/**'],
            setupFiles: ['./vitest-setup-client.ts']
          }
        },
        {
          extends: './vite.config.ts',
          test: {
            name: 'server',
            environment: 'node',
            include: ['src/**/*.{test,spec}.{js,ts}'],
            exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
          }
        }
      ]
    }
  };
});
