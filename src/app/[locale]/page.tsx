import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/about/About";
import { Stack } from "@/components/stack/Stack";
import { Projects } from "@/components/projects/Projects";
import { Content } from "@/components/content/Content";
import { getAllContent } from "@/lib/markdown";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Fetch both tutorials and blog articles
  const tutorials = getAllContent("tutorials", locale);
  const blogArticles = getAllContent("blog", locale);

  // Fetch Sanity Content (including Daily Briefings)
  let sanityArticles: any[] = [];
  try {
    const { getSanityArticles } = await import("@/sanity/lib/queries");
    sanityArticles = await getSanityArticles(locale);
  } catch (e) {
    console.error("Failed to fetch Sanity content for home:", e);
  }

  // Merge (Sanity + Local) and Deduplicate
  const allItems = [...sanityArticles, ...tutorials, ...blogArticles];
  const uniqueItems = Array.from(new Map(allItems.map(item => [item.slug, item])).values());

  // Sort by date and take latest 3
  // Sort by date and take latest 3
  const allContent = uniqueItems
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <Stack />
      <Projects />
      <Content tutorials={allContent} />
    </main>
  );
}
