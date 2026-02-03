"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ContentData } from "@/lib/markdown";
import { Link } from "@/i18n/routing";
import { ArrowUpRight, BookOpen, Download } from "lucide-react";

interface ArchiveGridProps {
  items: ContentData[];
  type: "resources" | "articles";
}

export const ArchiveGrid = ({ items, type }: ArchiveGridProps) => {
  const t = useTranslations("Archive");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Mouse position for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHoveredId(null);
  };

  const categories = ["all", ...Array.from(new Set(items.map(item => item.category)))];

  // Group by category and limit to 6
  // Filter by category
  const filteredItems = selectedCategory === "all"
    ? items
    : items.filter(item => item.category === selectedCategory);

  // Pagination Logic
  const [visibleCount, setVisibleCount] = useState(6);

  // Reset pagination when category changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(6);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  return (
    <div className="space-y-12">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedCategory === cat
                ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white"
              }`}
          >
            {cat === "all" ? t("all") : t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ perspective: "1500px" }}>
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item) => (
            <motion.div
              key={item.slug}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onMouseMove={(e) => handleMouseMove(e, item.slug)}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX: hoveredId === item.slug ? rotateX : 0,
                rotateY: hoveredId === item.slug ? rotateY : 0,
                transformStyle: "preserve-3d"
              }}
              whileHover={{
                scale: 1.05,
                rotateX: 10,
                rotateY: 5,
                z: 50,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="group relative h-[400px] rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-[0_40px_100px_rgba(0,240,255,0.25)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            >
              <Link href={`/archive/${type}/${item.slug}`} className="block h-full cursor-none">
                {/* Background Image Reveal on Hover */}
                <AnimatePresence>
                  {hoveredId === item.slug && item.image && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 0.2, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="absolute inset-0 z-0"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="absolute inset-0 p-10 flex flex-col justify-between z-20"
                  style={{ transform: "translateZ(50px)" }}
                >
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-xl">
                      {type === "resources" ? <Download className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <span className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">{item.date}</span>
                  </div>

                  <div style={{ transform: "translateZ(30px)" }}>
                    <div className="flex gap-2 mb-4">
                      {/* Filter tags */}
                      {item.tags
                        ?.filter(tag => tag && tag !== 'ARCHIVE.CATEGORIES.NULL')
                        .slice(0, 2) // Maintain limit of 2 tags
                        .map(tag => (
                          <span key={tag} className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
                            {tag}
                          </span>
                        ))}

                      {/* Show Category if valid tag is missing or as supplement? 
                          Original code used t(`categories.${item.category}`) here. 
                          The user requested fix for "ARCHIVE.CATEGORIES.NULL" which implies `item.category` or tags issues.
                          Let's stick to showing the Category from metadata as the fallback or primary badge 
                          BUT check if it's the "NULL" one. 
                          Wait, the screenshot showed "ARCHIVE.CATEGORIES.NULL" likely coming from `t('categories.' + item.category)`. 
                          Let's conditionally render the category badge.
                      */}
                      {item.category && item.category !== 'null' && (
                        <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
                          {t(`categories.${item.category}`)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-primary transition-colors duration-300 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-white/40 text-xs font-medium leading-relaxed group-hover:text-white/70 transition-colors duration-300 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                      {type === "resources" ? "Get Resource" : "Read Article"} <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-white/5 group-hover:border-primary/50 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-white/5 group-hover:border-primary/50 transition-colors duration-500" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-16">
          <motion.button
            onClick={handleLoadMore}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
          >
            {t("loadMore")}
          </motion.button>
        </div>
      )}

      {displayItems.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-white/20 font-mono text-sm uppercase tracking-widest">{t("noContent")}</p>
        </div>
      )}
    </div>
  );
};
