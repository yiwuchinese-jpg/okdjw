import { getAllContent } from "@/lib/markdown";
import { ArchiveGrid } from "@/components/archive/ArchiveGrid";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export default async function ArchivePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Archive");
  
  const resources = getAllContent("resources", locale);
  const articles = getAllContent("blog", locale);

  return (
    <main className="min-h-screen bg-black pt-40 pb-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-24">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 hover:text-primary transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" /> {t("backHome")}
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <span className="text-primary font-mono text-xs font-bold tracking-[0.5em] uppercase mb-4 block">
                {t("subtitle")}
              </span>
              <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter uppercase leading-[0.8]">
                RESOURCE<br />
                <span className="text-primary italic">ARCHIVE</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-40">
          {/* Resources Section */}
          <section id="resources">
            <div className="flex items-center gap-6 mb-16">
              <h2 className="text-4xl font-black tracking-tighter uppercase">{t("resources")}</h2>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>
            <ArchiveGrid items={resources} type="resources" />
          </section>

          {/* Articles Section */}
          <section id="articles">
            <div className="flex items-center gap-6 mb-16">
              <h2 className="text-4xl font-black tracking-tighter uppercase">{t("articles")}</h2>
              <div className="h-[1px] flex-grow bg-white/10" />
            </div>
            <ArchiveGrid items={articles} type="articles" />
          </section>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </main>
  );
}
