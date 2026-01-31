"use client";

import { useLocale } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { motion } from "framer-motion";
import { Languages } from "lucide-react";

export const LocaleSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <motion.button
      onClick={toggleLocale}
      className="fixed top-8 right-24 z-[100] flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Languages className="w-4 h-4 text-primary" />
      <span className="text-xs font-bold uppercase tracking-widest">
        {locale === "en" ? "ZH" : "EN"}
      </span>
    </motion.button>
  );
};
