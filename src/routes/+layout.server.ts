import { ANALYTICS_ID_LANGUAGE_APP } from '$env/static/private';
import type { MetaProps } from 'runes-meta-tags';
import { metaTitle, metaDescription, metaImg } from 'runes-meta-tags';

export const load = async ({ url, locals }) => {
  const title = metaTitle(url.pathname, __NAME__);
  const basicDesc = 'Master Norwegian Vocabulary with Flashcard.';
  const description = metaDescription(url.pathname, basicDesc);
  const image = metaImg(url.pathname, __NAME__);

  const layoutMetaTags: MetaProps = {
    title,
    description,
    keywords: 'Norwegian, language game, flashcards, learning, language',
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
      url: url.href,
      image,
      imageAlt: title,
      siteName: 'Norske Flashcard',
      imageWidth: '1200',
      imageHeight: '630'
    }
  };

  // Fetch display_name and target_level for the nav and quiz defaults.
  // Single-row select — minimal overhead on every request.
  let displayName: string | null = null;
  let targetLevel: string | null = null;
  if (locals.user) {
    const { data } = await locals.supabase
      .from('profiles')
      .select('display_name, target_level')
      .eq('id', locals.user.id)
      .maybeSingle();
    displayName = data?.display_name ?? null;
    targetLevel = data?.target_level ?? null;
  }

  return {
    layoutMetaTags,
    ANALYTICS_ID_LANGUAGE_APP,
    // Auth state — available as $page.data.user and $page.data.plan in all routes
    user: locals.user,
    plan: locals.plan,
    displayName,
    targetLevel
  };
};
