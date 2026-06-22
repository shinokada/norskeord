import type { PageServerLoad } from './$types';
import type { MetaProps } from 'runes-meta-tags';

export const load: PageServerLoad = () => {
  const title = 'How to Use Norskeord — Flashcards, Quiz, Grammar & Norskprøven Guide';
  const description =
    'Learn how to use every feature in Norskeord — vocabulary flashcards, quiz mode, grammar practice, and Norskprøven exam preparation. Plus: smart scheduling explained and FAQ.';

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
