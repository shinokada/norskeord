import type { PageServerLoad } from './$types';
import type { MetaProps } from 'runes-meta-tags';

export const load: PageServerLoad = ({ url }) => {
  const title = 'Norskprøven — Lær norsk ordforråd for A2 og B1 | Norskeord';
  const description =
    'Forbered deg til Norskprøven med gratis norske flashcards for A2 og B1. Øv på ordforråd for statsborgerskap, oppholdstillatelse og jobb i Norge.';

  const pageMetaTags: MetaProps = {
    title,
    description,
    keywords:
      'Norskprøven, norskprøven ordforråd, norskprøven A2, norskprøven B1, lære norsk statsborgerskap, norsk B1 gloser, norsk A2 ord, norsk oppholdstillatelse',
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

  return { pageMetaTags };
};
