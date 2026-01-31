import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/about/About";
import { Stack } from "@/components/stack/Stack";
import { Projects } from "@/components/projects/Projects";
import { Content } from "@/components/content/Content";
import { getAllContent } from "@/lib/markdown";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tutorials = getAllContent("tutorials", locale);
  
  return (
    <main className="min-h-screen">
      <Hero />
      <About />
      <Stack />
      <Projects />
      <Content tutorials={tutorials} />
    </main>
  );
}
