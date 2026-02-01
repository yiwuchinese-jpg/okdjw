import { groq } from 'next-sanity'
import { client } from './client'
import { ContentData } from '@/lib/markdown'

export async function getSanityArticles(locale: string): Promise<ContentData[]> {
  const query = groq`*[_type == "post" && locale == $locale] | order(publishedAt desc) {
    "slug": slug.current,
    title,
    "date": publishedAt,
    tags,
    category,
    "image": mainImage.asset->url,
    description
  }`
  return client.fetch(query, { locale })
}

export async function getSanityResources(locale: string): Promise<ContentData[]> {
  const query = groq`*[_type == "resource" && locale == $locale] | order(_createdAt desc) {
    "slug": slug.current,
    title,
    "date": _createdAt,
    tags,
    category,
    "image": mainImage.asset->url,
    description
  }`
  return client.fetch(query, { locale })
}

export async function getSanityContentData(type: 'post' | 'resource', slug: string, locale: string) {
  const query = groq`*[_type == $type && slug.current == $slug && locale == $locale][0] {
    "slug": slug.current,
    title,
    "date": publishedAt,
    tags,
    category,
    "image": mainImage.asset->url,
    description,
    body,
    downloadUrl
  }`
  return client.fetch(query, { type, slug, locale })
}
