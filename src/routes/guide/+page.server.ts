import type { PageServerLoad } from './$types';
import type { MetaProps } from 'runes-meta-tags';

export const load: PageServerLoad = () => {
  const title = 'How to Use Norskeord — Guide & FAQ';
  const description =
    'Learn how smart scheduling works, what the flashcard ratings mean, and get answers to common questions about Norskeord — the free Norwegian vocabulary app.';

  const pageMetaTags: MetaProps = {
    title,
    description,
    og: {
      type: 'article',
      title,
      description
    },
    twitter: {
      title,
      description
    }
  };

  return { pageMetaTags };
};
