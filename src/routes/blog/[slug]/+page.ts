import { error } from '@sveltejs/kit';
import { type PostMeta, type RawPostModule, cefrLevels } from '$lib/blog';
import { metaImg } from 'runes-meta-tags';
import type { PageLoad } from './$types';
import type { Component } from 'svelte';

export const prerender = true;

export const load: PageLoad = async ({ params }) => {
  const modules = import.meta.glob('/src/lib/posts/*.md') as Record<
    string,
    () => Promise<RawPostModule>
  >;

  for (const [, resolver] of Object.entries(modules)) {
    const mod = await resolver();
    if (mod.metadata?.slug === params.slug && mod.metadata.title && mod.metadata.publishedAt) {
      const meta = mod.metadata as PostMeta;
      const levels = cefrLevels(meta.cefr);

      // metaImg returns a URL with an unencoded title param (e.g. "?title=Bytte Vs Skifte").
      // new URL() would throw on the spaces, so we append level as a plain string instead.
      const ogImage =
        metaImg(`/blog/${params.slug}`, __NAME__) +
        '&level=' +
        encodeURIComponent(levels.join(','));

      const pageMetaTags = {
        title: `${meta.title} — Norskeord`,
        description: meta.description,
        og: {
          title: meta.title,
          description: meta.description,
          image: ogImage
        },
        twitter: {
          title: meta.title,
          description: meta.description,
          image: ogImage
        }
      };
      return {
        content: mod.default as Component,
        meta,
        pageMetaTags
      };
    }
  }

  throw error(404, `Post not found: ${params.slug}`);
};
