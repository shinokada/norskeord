import type { PageServerLoad } from './$types';
import type { MetaProps } from 'runes-meta-tags';

const SITE_URL = 'https://norskeord.no';

const pageTitle = 'Free Norwegian Learning Resources — Norskeord';
const pageDescription =
  'A curated list of free resources to learn Norwegian — online courses, podcasts, graded readers, grammar guides, and Norskprøven preparation. Covers A1 to B2 learners.';
const pageKeywords =
  'learn Norwegian free, free Norwegian resources, Norskprøven preparation, Norwegian online course, learn Norwegian online, Norwegian podcast, Norwegian grammar, Norwegian vocabulary, free Norwegian course, Norwegian for beginners';
const ogImage = `${SITE_URL}/og/default.png`;

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: pageTitle,
  description: pageDescription,
  url: `${SITE_URL}/resources`,
  inLanguage: 'en',
  provider: {
    '@type': 'Organization',
    name: 'Norskeord',
    url: SITE_URL
  }
};

export const load: PageServerLoad = async () => {
  const pageMetaTags: MetaProps = {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    og: {
      title: pageTitle,
      description: pageDescription,
      image: ogImage,
      imageWidth: '1200',
      imageHeight: '630',
      imageAlt: 'Free Norwegian Learning Resources — Norskeord'
    },
    twitter: {
      title: pageTitle,
      description: pageDescription,
      image: ogImage,
      imageAlt: 'Free Norwegian Learning Resources — Norskeord'
    }
  };

  return { pageMetaTags, webPageSchema };
};
