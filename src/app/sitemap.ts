import { MetadataRoute } from 'next';
import { getAllContent } from '@/lib/markdown';
import { getSanityArticles, getSanityResources } from '@/sanity/lib/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://okdjw.com';
  const locales = ['zh', 'en'];
  const contentTypes = ['blog', 'resources', 'tutorials'] as const;

  const routes = ['', '/archive'];

  const staticEntries: MetadataRoute.Sitemap = [];

  // Generate static routes for each locale
  locales.forEach((locale) => {
    routes.forEach((route) => {
      staticEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    });
  });

  // Generate dynamic routes for content
  const dynamicEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // 1. Add Markdown content
    for (const type of contentTypes) {
      const contents = getAllContent(type, locale);
      const prefix = type === 'blog' ? 'articles' : type === 'resources' ? 'resources' : 'tutorials';

      contents.forEach((content) => {
        if (type !== 'tutorials') {
          dynamicEntries.push({
            url: `${baseUrl}/${locale}/archive/${prefix}/${content.slug}`,
            lastModified: new Date(content.date),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      });
    }

    // 2. Add Sanity content (Articles)
    try {
      const sanityArticles = await getSanityArticles(locale);
      sanityArticles.forEach((post) => {
        dynamicEntries.push({
          url: `${baseUrl}/${locale}/archive/articles/${post.slug}`,
          lastModified: new Date(post.date),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });

      const sanityResources = await getSanityResources(locale);
      sanityResources.forEach((res) => {
        dynamicEntries.push({
          url: `${baseUrl}/${locale}/archive/resources/${res.slug}`,
          lastModified: new Date(res.date),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    } catch (e) {
      console.error("Sitemap generation error content fetching:", e);
    }
  }

  return [...staticEntries, ...dynamicEntries];
}
