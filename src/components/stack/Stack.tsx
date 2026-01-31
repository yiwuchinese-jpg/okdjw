"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useScroll } from "framer-motion";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { 
  TrendingUp, Code2, Palette, Globe, Cpu, 
  BarChart3, Zap, ShieldCheck, Smartphone 
} from "lucide-react";

export const Stack = () => {
  const t = useTranslations("Stack");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Mouse position for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  const scrollTilt = useTransform(scrollYProgress, [0, 0.5, 1], [-5, 0, 5]);

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

  const skillsList = [
    {
      id: "growth",
      icon: <TrendingUp />,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "dev",
      icon: <Code2 />,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "ai",
      icon: <Cpu />,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "design",
      icon: <Palette />,
      image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "marketing",
      icon: <Globe />,
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "analytics",
      icon: <BarChart3 />,
      image: "https://images.unsplash.com/photo-1551288049-bbda6462f744?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <section ref={targetRef} className="py-32 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-20">
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-primary font-mono text-xs font-bold tracking-[0.5em] uppercase mb-4 block"
          >
            {t("subtitle")}
          </motion.span>
          <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.8]">
            {t.rich("title", {
              italic: (chunks) => <span className="text-primary italic">{chunks}</span>
            })}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ perspective: "1500px" }}>
          {skillsList.map((skill) => (
            <motion.div
              key={skill.id}
              onMouseMove={(e) => handleMouseMove(e, skill.id)}
              onMouseLeave={handleMouseLeave}
              style={{ 
                rotateX: hoveredId === skill.id ? rotateX : scrollTilt, 
                rotateY: hoveredId === skill.id ? rotateY : 0,
                transformStyle: "preserve-3d"
              }}
              whileHover={{ 
                scale: 1.05,
                rotateX: 10,
                rotateY: 5,
                z: 50,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative h-[450px] rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-[0_40px_100px_rgba(0,240,255,0.25)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-none"
            >
              {/* Background Image with Parallax-like effect */}
              <AnimatePresence>
                {hoveredId === skill.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 z-0"
                  >
                    <img 
                      src={skill.image} 
                      alt={t(`skills.${skill.id}.title`)}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div 
                className="absolute inset-0 p-10 flex flex-col justify-between z-20"
                style={{ transform: "translateZ(50px)" }}
              >
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-xl">
                    {skill.icon}
                  </div>
                  <div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{t("expertise")}</span>
                    <div className="h-[1px] w-8 bg-primary" />
                  </div>
                </div>

                <div style={{ transform: "translateZ(30px)" }}>
                  <h3 className="text-3xl font-black text-white mb-3 group-hover:text-primary transition-colors duration-300 tracking-tight">
                    {t(`skills.${skill.id}.title`)}
                  </h3>
                  <p className="text-white/40 text-sm font-medium leading-relaxed group-hover:text-white/70 transition-colors duration-300 line-clamp-3">
                    {t(`skills.${skill.id}.description`)}
                  </p>
                  
                  <div className="mt-8 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    {t.raw(`skills.${skill.id}.tags`).map((tag: string) => (
                      <span key={tag} className="text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 border border-primary/30 text-primary rounded-lg bg-primary/5 backdrop-blur-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-white/5 group-hover:border-primary/50 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-white/5 group-hover:border-primary/50 transition-colors duration-500" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Text */}
      <div className="absolute -bottom-20 -left-20 text-[20vw] font-black text-white/[0.02] select-none pointer-events-none uppercase">
        {t("subtitle")}
      </div>
    </section>
  );
};
