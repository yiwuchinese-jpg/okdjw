import { getContentData } from "@/lib/markdown";
import { getSanityContentData } from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { Metadata } from "next";
import { PortableText } from "@/components/PortableText";

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

  let contentData: any = null;
  let isSanity = false;
  let tocItems: any[] = [];

  // 1. Try Sanity first
  const sanityData = await getSanityContentData('post', slug, locale);

  if (sanityData) {
    isSanity = true;
    contentData = sanityData;
    const { extractTocFromSanity } = await import("@/lib/toc");
    tocItems = extractTocFromSanity(sanityData.body);
  } else {
    // 2. Fallback to Markdown
    try {
      contentData = await getContentData("blog", slug, locale);
      const { extractTocFromMarkdown } = await import("@/lib/toc");
      tocItems = extractTocFromMarkdown(contentData.contentHtml || "");
    } catch (e) {
      notFound();
    }
  }

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": contentData.title,
    "description": contentData.description,
    "image": contentData.image ? [contentData.image] : [],
    "datePublished": contentData.date,
    "author": [{
      "@type": "Person",
      "name": "Justin Du",
      "url": "https://okdjw.com"
    }]
  };

  const { TableOfContents } = await import("@/components/article/TableOfContents");
  const { AuthorProfile } = await import("@/components/article/AuthorProfile");

  return (
    <main className="min-h-screen bg-black pt-32 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto px-4 max-w-[1400px]">
        {/* Back Link */}
        <Link
          href="/archive#articles"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 hover:text-primary transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> {t("backHome")}
        </Link>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-12 relative items-start">

          {/* Left Column: Table of Contents (Desktop) */}
          <aside className="hidden lg:block">
            <TableOfContents items={tocItems} />
          </aside>

          {/* Middle Column: Content */}
          <article className="min-w-0"> {/* min-w-0 ensures flex child doesn't overflow */}
            <header className="mb-16">
              <div className="flex flex-wrap gap-4 mb-8">
                {contentData.tags?.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                ))}
                <span className="flex items-center gap-2 px-4 py-1 bg-white/5 text-white/40 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  <Calendar className="w-3 h-3" /> {new Date(contentData.date).toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-tight uppercase">
                {contentData.title}
              </h1>

              <p className="text-xl text-white/40 leading-relaxed font-medium italic border-l-4 border-primary/30 pl-8 py-2">
                {contentData.description}
              </p>
            </header>

            {/* Content Body */}
            <div className="max-w-none prose prose-invert prose-primary
              prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase
              prose-p:text-white/60 prose-p:leading-relaxed prose-p:text-lg
              prose-strong:text-white prose-strong:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-3xl prose-img:border prose-img:border-white/10">
              {isSanity ? (
                contentData.body && <PortableText value={contentData.body} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: contentData.contentHtml || "" }} />
              )}
            </div>

            {/* Mobile Author Profile (Bottom) */}
            <div className="lg:hidden mt-24">
              <div className="w-12 h-1 bg-white/10 mx-auto rounded-full mb-12" />
              <AuthorProfile />
            </div>
          </article>

          {/* Right Column: Author Profile (Desktop) */}
          <aside className="hidden lg:block h-full"> {/* h-full to match height if needed, but sticky is inside component */}
            <AuthorProfile />
          </aside>

        </div>

        {/* Mobile TOC (Drawer) */}
        <div className="lg:hidden">
          <TableOfContents items={tocItems} />
        </div>

      </div>
    </main>
  );
}
