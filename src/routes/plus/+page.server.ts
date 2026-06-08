import type { PageServerLoad } from './$types';
import type { MetaProps } from 'runes-meta-tags';

export const load: PageServerLoad = ({ locals, url }) => {
  const title = 'Norskeord Plus — Study Smarter, Remember More';
  const description =
    'Upgrade to Plus for smart review scheduling, full A1–C vocabulary access, cross-device sync, and complete Norskprøven exam prep. Built for serious Norwegian learners.';

  const pageMetaTags: MetaProps = {
    title,
    description,
    keywords:
      'Norwegian flashcard plus, FSRS Norwegian, spaced repetition Norwegian, learn Norwegian app, Norskprøven B1 vocabulary',
    og: {
      type: 'website',
      title,
      description,
      url: url.href,
      siteName: 'Norskeord'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };

  return {
    pageMetaTags,
    isLoggedIn: locals.user !== null,
    isPlus: locals.plan === 'plus'
  };
};
