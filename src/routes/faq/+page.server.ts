import type { PageServerLoad } from './$types';
import type { MetaProps } from 'runes-meta-tags';

export const load: PageServerLoad = () => {
  const title = 'FAQ — Norskeord';
  const description =
    'Frequently asked questions about Norskeord — free vs Plus, study reminders, cross-device sync, offline use, Norskprøven prep, and more.';

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
