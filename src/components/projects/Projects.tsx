"use client";

import { motion, useTransform, useScroll, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import { ExternalLink, Github } from "lucide-react";

import { useTranslations } from "next-intl";

export const Projects = () => {
  const t = useTranslations("Projects");
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Mouse position for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 100, damping: 20 });

  const scrollTilt = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHoveredIndex(null);
  };

  const projectsList = [
    {
      id: "chineseyiwu",
      color: "bg-[#00f0ff]",
      link: "https://chineseyiwu.com",
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "buydiscoball",
      color: "bg-[#7000ff]",
      link: "https://buydiscoball.com",
      image: "https://images.unsplash.com/photo-1574391884720-bbe3740e53d9?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "ifan",
      color: "bg-[#ff00c8]",
      link: "https://ifanholding.com",
      image: "https://images.unsplash.com/photo-1551288049-bbda6462f744?auto=format&fit=crop&w=1200&q=80"
    },
  ];

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.6%"]);

  return (
    <section id="projects" ref={targetRef} className="relative h-[300vh] bg-black">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-12 px-12 md:px-24">
          <div className="flex flex-col justify-center min-w-[300px] md:min-w-[500px]">
            <span className="text-primary font-mono text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">{t("subtitle")}</span>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-[0.8]">
              {t.rich("title", {
                italic: (chunks) => <span className="text-primary italic">{chunks}</span>,
                br: () => <br />
              })}
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-white/20" />
              <p className="text-foreground/30 font-bold font-mono text-[10px] uppercase tracking-[0.2em]">
                {t("scroll")}
              </p>
            </div>
          </div>

          {projectsList.map((project, index) => (
            <motion.div
              key={index}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
              style={{ 
                rotateX: hoveredIndex === index ? rotateX : scrollTilt, 
                rotateY: hoveredIndex === index ? rotateY : 0,
                transformStyle: "preserve-3d",
                perspective: "1500px"
              }}
              whileHover={{ 
                scale: 1.02,
                rotateX: 5,
                rotateY: 2,
                z: 40,
                transition: { duration: 0.4, ease: "easeOut" }
              }}
              className="group relative h-[70vh] w-[85vw] md:w-[60vw] lg:w-[50vw] flex-shrink-0 overflow-hidden rounded-[3rem] border border-white/5 bg-muted/20 shadow-2xl transition-all duration-300 hover:border-primary/30 cursor-none"
            >
              {/* Background Image with depth */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/90 z-10" />
                <motion.img 
                  src={project.image} 
                  alt={t(`items.${project.id}.title`)}
                  style={{ transform: "translateZ(-50px) scale(1.1)" }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000"
                />
              </div>

              {/* Project Card Content with Z-axis depth */}
              <div 
                className="absolute inset-0 p-12 md:p-20 flex flex-col justify-between z-20"
                style={{ transform: "translateZ(50px)" }}
              >
                <div className="flex flex-wrap gap-3">
                  {t.raw(`items.${project.id}.tags`).map((tag: string) => (
                    <span key={tag} className="px-4 py-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 shadow-lg">
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ transform: "translateZ(30px)" }}>
                  <h3 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter group-hover:text-primary transition-colors duration-500 drop-shadow-2xl">
                    {t(`items.${project.id}.title`)}
                  </h3>
                  <p className="text-white/50 text-xl max-w-2xl leading-relaxed font-medium mb-12 group-hover:text-white/80 transition-colors drop-shadow-md">
                    {t(`items.${project.id}.description`)}
                  </p>
                  
                  <div className="flex gap-6">
                    <motion.a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      whileHover={{ scale: 1.05, translateZ: 20 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-4 px-10 py-5 bg-white text-black font-black rounded-full text-[10px] uppercase tracking-[0.2em] hover:bg-primary transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_30px_rgba(0,240,255,0.3)]"
                    >
                      {t("viewLive")} <ExternalLink className="w-5 h-5" />
                    </motion.a>
                    <motion.button 
                      whileHover={{ scale: 1.05, borderColor: "#fff", translateZ: 20 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-5 border border-white/10 rounded-full hover:bg-white/5 transition-all duration-300 backdrop-blur-md shadow-xl"
                    >
                      <Github className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Decorative Corner Glow */}
              <div className={`absolute -top-32 -right-32 w-80 h-80 ${project.color} blur-[140px] opacity-10 group-hover:opacity-40 transition-opacity duration-1000`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
