"use client";

import { useLocale } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const locales = [
  { code: "zh", name: "中文", label: "ZH" },
  { code: "en", name: "English", label: "EN" },
  { code: "es", name: "Español", label: "ES" },
  { code: "ru", name: "Русский", label: "RU" },
  { code: "ar", name: "العربية", label: "AR" },
  { code: "de", name: "Deutsch", label: "DE" },
  { code: "fr", name: "Français", label: "FR" },
];

export const LocaleSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    // @ts-ignore
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  const currentLocale = locales.find((l) => l.code === locale) || locales[1];

  return (
    <div className="fixed top-8 right-8 z-[100]" ref={containerRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full hover:bg-black/30 transition-all shadow-2xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Languages className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-white">
          {currentLocale.label}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3 text-white/50" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-48 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2"
          >
            <div className="flex flex-col gap-1">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLocale(l.code)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all group ${locale === l.code
                      ? "bg-primary/20 text-primary"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-[10px] opacity-50 uppercase">{l.code}</span>
                  </div>
                  {locale === l.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
