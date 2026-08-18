import { parsePosts, type RawPostModule } from '$lib/blog';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const modules = import.meta.glob('/src/lib/posts/*.md', { eager: true }) as Record<
    string,
    RawPostModule
  >;
  const posts = parsePosts(modules);

  const pageMetaTags = {
    title: 'Norwegian Language Blog — Norskeord',
    description:
      'Short, practical articles about Norwegian vocabulary and grammar — with real examples.',
    og: {
      title: 'Norwegian Language Blog — Norskeord',
      description:
        'Short, practical articles about Norwegian vocabulary and grammar — with real examples.'
    }
  };

  return { posts, pageMetaTags };
};
