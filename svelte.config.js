import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],

  kit: {
    adapter: adapter(),
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Cross-links in blog posts may reference future or unpublished posts.
        // Warn instead of throwing so the build doesn't fail.
        if (path.startsWith('/blog/')) {
          console.warn(`Prerender warning: ${message} (linked from ${referrer})`);
          return;
        }
        throw new Error(message);
      }
    }
  }
};

export default config;
