import { getContentData } from "@/lib/markdown";
import { getSanityContentData } from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    // 1. Try Sanity first
    const sanityData = await getSanityContentData('post', slug, locale);
    if (sanityData) {
      return {
        title: sanityData.title,
        description: sanityData.description,
        openGraph: {
          title: sanityData.title,
          description: sanityData.description,
          type: "article",
          publishedTime: sanityData.date,
          images: sanityData.image ? [{ url: sanityData.image }] : [],
        },
      };
    }

    // 2. Fallback to Markdown
    const data = await getContentData("blog", slug, locale);
    return {
      title: data.title,
      description: data.description,
      openGraph: {
        title: data.title,
        description: data.description,
        type: "article",
        publishedTime: data.date,
        images: data.image ? [{ url: data.image }] : [],
      },
    };
  } catch (e) {
    return { title: "Not Found" };
  }
}

export default async function ArticleDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("Archive");

  try {
    const data = await getContentData("blog", slug, locale);

    // JSON-LD Structured Data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": data.title,
      "description": data.description,
      "image": data.image ? [data.image] : [],
      "datePublished": data.date,
      "author": [{
        "@type": "Person",
        "name": "Justin Du",
        "url": "https://okdjw.com"
      }]
    };

    return (
      <main className="min-h-screen bg-black pt-40 pb-32">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/archive#articles"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 hover:text-primary transition-colors mb-16"
          >
            <ArrowLeft className="w-4 h-4" /> {t("backHome")}
          </Link>

          <header className="mb-16">
            <div className="flex flex-wrap gap-4 mb-8">
              {data.tags.map(tag => (
                <span key={tag} className="flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
              <span className="flex items-center gap-2 px-4 py-1 bg-white/5 text-white/40 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <Calendar className="w-3 h-3" /> {data.date}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-tight">
              {data.title}
            </h1>

            <p className="text-xl text-white/40 leading-relaxed font-medium italic border-l-4 border-primary/30 pl-8 py-2">
              {data.description}
            </p>
          </header>

          <div
            className="prose prose-invert prose-primary max-w-none 
              prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase
              prose-p:text-white/60 prose-p:leading-relaxed prose-p:text-lg
              prose-strong:text-white prose-strong:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-3xl prose-img:border prose-img:border-white/10"
            dangerouslySetInnerHTML={{ __html: data.contentHtml || "" }}
          />
        </div>

        {/* Background Decoration */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />
      </main>
    );
  } catch (e) {
    notFound();
  }
}
