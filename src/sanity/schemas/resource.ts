import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'resource',
  title: '资源 (Resources)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL 路径 (Slug)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: (slug, context) => {
          const { getClient, document } = context;
          if (!document) return Promise.resolve(true);

          const client = getClient({ apiVersion: '2024-02-01' });
          const id = document._id.replace(/^drafts\./, '');
          // @ts-ignore
          const locale = document.locale;
          const type = document._type;

          const query = `*[_type == $type && slug.current == $slug && locale == $locale && _id != $id && !(_id in ["drafts." + $id])]`;
          const params = { type, slug, locale, id };

          return client.fetch(query, params).then((res: any[]) => res.length === 0);
        },
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'locale',
      title: '语言',
      type: 'string',
      options: {
        list: [
          { title: '中文', value: 'zh' },
          { title: 'English', value: 'en' },
        ],
      },
      initialValue: 'zh',
    }),
    defineField({
      name: 'mainImage',
      title: '封面图片',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'description',
      title: '摘要 (SEO)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'category',
      title: '分类',
      type: 'string',
      options: {
        list: [
          { title: 'Sourcing', value: 'Sourcing' },
          { title: 'AI', value: 'AI' },
          { title: 'Guide', value: 'Guide' },
          { title: 'Growth', value: 'Growth' },
        ],
      },
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'downloadUrl',
      title: '下载链接',
      type: 'url',
    }),
    defineField({
      name: 'body',
      title: '正文/介绍',
      type: 'blockContent',
    }),
  ],
})
