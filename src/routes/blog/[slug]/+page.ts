import { error } from '@sveltejs/kit';
import { type PostMeta, type RawPostModule, cefrLevels, isPublished } from '$lib/blog';
import type { EntryGenerator, PageLoad } from './$types';
import type { Component } from 'svelte';

export const prerender = true;

export const entries: EntryGenerator = async () => {
  const modules = import.meta.glob('/src/lib/posts/*.md', { eager: true }) as Record<
    string,
    RawPostModule
  >;
  return Object.values(modules)
    .filter(
      (mod) =>
        mod.metadata?.slug && mod.metadata.publishedAt && isPublished(mod.metadata.publishedAt)
    )
    .map((mod) => ({ slug: mod.metadata!.slug! }));
};

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
      const ogImage = `https://norskeord.no/og/blog/${params.slug}.png`;

      const postKeywords = [
        ...levels.map((l) => `Norwegian ${l} vocabulary`),
        'learn Norwegian',
        'Norwegian grammar',
        'Norskprøven'
      ].join(', ');

      const pageMetaTags = {
        title: `${meta.title} — Norskeord`,
        description: meta.description,
        keywords: postKeywords,
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

      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: meta.title,
        description: meta.description,
        datePublished: meta.publishedAt,
        ...(meta.updatedAt ? { dateModified: meta.updatedAt } : {}),
        inLanguage: 'nb',
        image: ogImage,
        url: `https://norskeord.no/blog/${params.slug}`,
        author: {
          '@type': 'Organization',
          name: 'Norskeord',
          url: 'https://norskeord.no'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Norskeord',
          url: 'https://norskeord.no'
        }
      };

      return {
        content: mod.default as Component,
        meta,
        pageMetaTags,
        articleSchema
      };
    }
  }

  throw error(404, `Post not found: ${params.slug}`);
};
