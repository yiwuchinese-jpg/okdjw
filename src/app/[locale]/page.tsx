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

  // Merge and sort them by date to show the latest 3 on the homepage
  const allContent = [...tutorials, ...blogArticles]
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
