"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Mail, Instagram, Linkedin, Send } from "lucide-react";
import { ContentData } from "@/lib/markdown";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface ContentProps {
  tutorials: ContentData[];
}

export const Content = ({ tutorials }: ContentProps) => {
  const t = useTranslations("Content");

  return (
    <section className="bg-black pt-32">
      {/* Tutorials Section */}
      <div className="container mx-auto px-4 mb-40">
        {/* ... existing header code ... */}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <span className="text-primary font-mono text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">{t("subtitle")}</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
              {t.rich("title", {
                italic: (chunks) => <span className="text-primary italic">{chunks}</span>
              })}
            </h2>
          </div>
          <Link href="/archive">
            <motion.button
              whileHover={{ x: 10, color: "#00f0ff" }}
              className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-foreground/40 transition-colors cursor-pointer"
            >
              {t("explore")} <ArrowUpRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutorials.map((post, index) => {
            // Sanity posts don't have a 'type' field in the current query, defaulting them to 'blog' (articles)
            // If it has a type field (from markdown), use it.
            const typeLower = post.type?.toLowerCase() || 'blog';
            const prefix = typeLower === 'tutorials' ? 'tutorials' : typeLower === 'resources' ? 'resources' : 'articles';
            const href = `/archive/${prefix}/${post.slug}`;

            return (
              <Link key={post.slug} href={href}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group p-8 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-md hover:border-primary/30 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] h-full cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex gap-2">
                      {/* Filter tags and map */}
                      {post.tags
                        ?.filter(tag => tag && tag !== 'ARCHIVE.CATEGORIES.NULL')
                        .slice(0, 2)
                        .map(tag => (
                          <span key={tag} className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {tag}
                          </span>
                        ))}
                    </div>
                    <span className="text-[10px] font-mono text-foreground/20">
                      {post.date}
                    </span>
                  </div>
                  {/* ... title, description ... */}
                  <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>

                  <p className="text-foreground/40 text-sm leading-relaxed mb-8 line-clamp-3 group-hover:text-foreground/60 transition-colors">
                    {post.description}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0 mt-auto">
                    {t("readMore")} <ArrowUpRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>


      {/* Contact Section */}
      <div className="border-t border-white/5 pt-40 pb-20 px-4 relative overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-32"
          >
            <h2 className="text-7xl md:text-9xl font-black tracking-tighter mb-12 leading-[0.8]">
              {t.rich("contact.title", {
                italic: (chunks) => <span className="text-primary italic">{chunks}</span>,
                br: () => <br />
              })}
            </h2>
            <motion.a
              href="mailto:buydiscoball@gmail.com"
              whileHover={{ scale: 1.05 }}
              className="inline-block text-3xl md:text-5xl font-light text-foreground/40 hover:text-white transition-colors border-b border-primary/20 hover:border-primary pb-2"
            >
              buydiscoball@gmail.com
            </motion.a>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-12 pt-20 border-t border-white/5">
            <div className="flex gap-8">
              {[Instagram, Linkedin, Send, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -5, color: "#00f0ff" }}
                  className="p-4 bg-white/5 rounded-2xl border border-white/5 text-foreground/60 hover:border-primary/20 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>

            <div className="text-center md:text-right">
              <p className="text-[10px] font-bold font-mono text-foreground/20 uppercase tracking-[0.5em] mb-2">
                © 2024 okdjw.com · Yiwu, China
              </p>
              <p className="text-[8px] font-mono text-foreground/10 uppercase tracking-widest">
                {t("contact.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent -z-10" />
      </div>
    </section>
  );
};
