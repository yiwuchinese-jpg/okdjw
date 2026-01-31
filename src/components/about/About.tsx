"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";

export const About = () => {
  const t = useTranslations("About");
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center py-32 px-4 bg-black overflow-hidden"
    >
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        {/* Left: Styled Image Placeholder */}
        <motion.div 
          style={{ y }}
          className="relative aspect-[4/5] w-full max-w-md mx-auto bg-muted border border-white/10 overflow-hidden group rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <img 
            src="/images/me.jpg" 
            alt="Justin Du"
            className="w-full h-full object-cover transition-all duration-700 scale-110 group-hover:scale-100"
          />
          
          <div className="absolute bottom-10 left-10 z-20">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-white tracking-tighter"
            >
              Justin Du
            </motion.h3>
            <p className="text-primary text-xs font-bold font-mono tracking-[0.3em] uppercase mt-2">{t("info")}</p>
          </div>
        </motion.div>

        {/* Right: Content */}
        <motion.div 
          style={{ opacity }}
          className="flex flex-col gap-12"
        >
          <div className="relative">
            <span className="text-primary font-mono text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">{t("tags.origin")}</span>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">
              {t("title")}
            </h2>
            <p className="text-foreground/50 leading-relaxed text-lg font-medium border-l-2 border-primary/20 pl-6">
              {t("origin")}
            </p>
          </div>

          <div>
            <span className="text-primary font-mono text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">{t("tags.career")}</span>
            <p className="text-foreground/50 leading-relaxed text-lg font-medium">
              {t("career")}
            </p>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <span className="text-primary font-mono text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">{t("tags.name")}</span>
            <p className="text-white/80 leading-relaxed text-lg font-bold italic">
              {t("nameStory")}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -z-10" />
    </section>
  );
};
