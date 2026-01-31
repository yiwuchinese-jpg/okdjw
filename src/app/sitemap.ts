import { MetadataRoute } from 'next';
import { getAllContent } from '@/lib/markdown';

export default function sitemap(): MetadataRoute.Sitemap {
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

  locales.forEach((locale) => {
    contentTypes.forEach((type) => {
      const contents = getAllContent(type, locale);
      const prefix = type === 'blog' ? 'articles' : type === 'resources' ? 'resources' : 'tutorials';
      
      contents.forEach((content) => {
        // Tutorials are currently only on the home page, so we only add blog and resources
        if (type !== 'tutorials') {
          dynamicEntries.push({
            url: `${baseUrl}/${locale}/archive/${prefix}/${content.slug}`,
            lastModified: new Date(content.date),
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      });
    });
  });

  return [...staticEntries, ...dynamicEntries];
}
