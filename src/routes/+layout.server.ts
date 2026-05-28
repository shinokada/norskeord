import { ANALYTICS_ID_LANGUAGE_APP } from '$env/static/private';
import type { MetaProps } from 'runes-meta-tags';
import { metaTitle, metaDescription, metaImg } from 'runes-meta-tags';

const SITE_NAME = 'Norskeord';
const SITE_URL = 'https://norskeord.no';
const DEFAULT_DESC =
  'Free Norwegian flashcards from A1 to C2. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.';
const KEYWORDS =
  'Norwegian vocabulary, learn Norwegian, flashcards, Norskprøven, CEFR, A1 A2 B1 B2 C1 C2, spaced repetition, Norwegian words';

export const load = async ({ url, locals }) => {
  const title = metaTitle(url.pathname, __NAME__);
  const description = metaDescription(url.pathname, DEFAULT_DESC);
  const image = metaImg(url.pathname, __NAME__);
  const canonical = `${SITE_URL}${url.pathname}`;

  const layoutMetaTags: MetaProps = {
    title,
    description,
    keywords: KEYWORDS,
    canonical,
    twitter: {
      card: 'summary_large_image',
      site: '@shinokada',
      creator: '@shinokada',
      title,
      description,
      image,
      imageAlt: title
    },
    og: {
      type: 'website',
      title,
      description,
      url: canonical,
      image,
      imageAlt: title,
      siteName: SITE_NAME,
      imageWidth: '1200',
      imageHeight: '630'
    }
  };

  // Fetch display_name and target_level for the nav and quiz defaults.
  // Single-row select — minimal overhead on every request.
  let displayName: string | null = null;
  let targetLevel: string | null = null;
  let sessionLimit: number | null = null;
  let showExample: boolean = false;
  if (locals.user) {
    const { data } = await locals.supabase
      .from('profiles')
      .select('display_name, target_level, session_limit, show_example')
      .eq('id', locals.user.id)
      .maybeSingle();
    displayName = data?.display_name ?? null;
    targetLevel = data?.target_level ?? null;
    sessionLimit = data?.session_limit ?? null;
    showExample = data?.show_example ?? false;
  }

  return {
    layoutMetaTags,
    ANALYTICS_ID_LANGUAGE_APP,
    // Auth state — available as $page.data.user and $page.data.plan in all routes
    user: locals.user,
    plan: locals.plan,
    displayName,
    targetLevel,
    sessionLimit,
    showExample
  };
};
