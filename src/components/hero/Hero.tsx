"use client";

import { motion, useMotionValue, useSpring, useTransform, Variants, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { FluidBackground } from "./FluidBackground";
import { LocaleSwitcher } from "../ui/LocaleSwitcher";
import { useEffect, useState } from "react";

export const Hero = () => {
  const t = useTranslations("Hero");
  
  // Mouse position for interactive parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for the parallax
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Transform values based on mouse position
  const rotateX = useTransform(springY, [-500, 500], [5, -5]);
  const rotateY = useTransform(springX, [-500, 500], [-5, 5]);
  const textX = useTransform(springX, [-500, 500], [-10, 10]);
  const textY = useTransform(springY, [-500, 500], [-10, 10]);

  const [phase, setPhase] = useState<"typing" | "final">("typing");
  const [displayText, setDisplayText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isHoveredButton, setIsHoveredButton] = useState<string | null>(null);
  const [showBall, setShowBall] = useState(false);
  const [isSplashing, setIsSplashing] = useState(false);
  
  const segments = t.raw("segments");
  const [segmentIndex, setSegmentIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = clientX - window.innerWidth / 2;
      const y = clientY - window.innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);

    if (phase === "typing") {
      let charIndex = 0;
      const currentFullText = segments[segmentIndex];
      
      const timer = setInterval(() => {
        setDisplayText(currentFullText.slice(0, charIndex));
        charIndex++;
        
        if (segmentIndex === 2 && charIndex === Math.floor(currentFullText.length / 2)) {
          setShowBall(true);
        }
        
        if (charIndex > currentFullText.length) {
          clearInterval(timer);
          
          setTimeout(() => {
            if (segmentIndex < segments.length - 1) {
              setSegmentIndex(prev => prev + 1);
              setDisplayText("");
            }
          }, 600);
        }
      }, 70);

      return () => {
        clearInterval(timer);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
      };
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [phase, segmentIndex, mouseX, mouseY]);

  // Paint splash particles data
  const splashParticles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    angle: (i / 12) * Math.PI * 2,
    distance: 100 + Math.random() * 150,
    size: 10 + Math.random() * 30,
    delay: Math.random() * 0.1
  }));

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants: Variants = {
    initial: { opacity: 0, y: 30, filter: "blur(10px)" },
    animate: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const titleVariants: Variants = {
    initial: { opacity: 0, scale: 0.9, filter: "blur(20px)" },
    animate: { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const [isTorn, setIsTorn] = useState(false);

  useEffect(() => {
    // Paper tearing sequence
    const timer = setTimeout(() => {
      setIsTorn(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
      <FluidBackground />
      <LocaleSwitcher />
      
      <motion.div 
        variants={containerVariants}
        initial="initial"
        animate="animate"
        style={{ 
          rotateX: isMobile ? 0 : rotateX, 
          rotateY: isMobile ? 0 : rotateY,
          perspective: 1500 
        }}
        className="container px-4 z-10 flex flex-col items-center text-center"
      >
        <motion.div variants={itemVariants} className="mb-12">
          <div className="relative group flex items-center justify-center">
            {/* The Welcome Text (Revealed behind the tear) */}
            <motion.div 
              animate={{ 
                opacity: isTorn ? 1 : 0,
                scale: isTorn ? 1 : 0.9,
              }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="px-8 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative z-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_#00f0ff]" />
                <span className="text-[11px] font-black tracking-[0.6em] uppercase text-white/90">
                  {t("welcome")}
                </span>
              </div>
            </motion.div>

            {/* Paper Tearing Effect - Specifically tearing a hole in the "background" paper */}
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none scale-150">
              {/* Left Flap of the Tear */}
              <motion.div 
                initial={{ x: 0, rotateY: 0 }}
                animate={isTorn ? { 
                  x: -60, 
                  rotateY: -70,
                  opacity: 0,
                  transition: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }
                } : {}}
                className="absolute inset-y-0 left-0 w-1/2 bg-black z-20 origin-left"
                style={{ 
                  clipPath: "polygon(0% 0%, 100% 0%, 85% 10%, 100% 20%, 88% 30%, 100% 40%, 85% 50%, 100% 60%, 88% 70%, 100% 80%, 85% 90%, 100% 100%, 0% 100%)",
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.5) inset"
                }}
              >
                {/* Torn Edge Detail */}
                <div className="absolute top-0 right-0 w-2 h-full bg-white/10 blur-[1px]" />
              </motion.div>

              {/* Right Flap of the Tear */}
              <motion.div 
                initial={{ x: 0, rotateY: 0 }}
                animate={isTorn ? { 
                  x: 60, 
                  rotateY: 70,
                  opacity: 0,
                  transition: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }
                } : {}}
                className="absolute inset-y-0 right-0 w-1/2 bg-black z-20 origin-right"
                style={{ 
                  clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 90%, 12% 80%, 0% 70%, 15% 60%, 0% 50%, 12% 40%, 0% 30%, 15% 20%, 0% 10%)",
                  boxShadow: "10px 0 30px rgba(0,0,0,0.5) inset"
                }}
              >
                {/* Torn Edge Detail */}
                <div className="absolute top-0 left-0 w-2 h-full bg-white/10 blur-[1px]" />
              </motion.div>

              {/* Tearing Light / Spark Effect */}
              <AnimatePresence>
                {!isTorn && (
                  <motion.div 
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: [0, 1, 0], scaleY: [0, 1.2, 0] }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-primary blur-md z-30"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Hint for interaction after torn */}
            {isTorn && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
                  <span className="text-[8px] font-mono text-primary/40 uppercase tracking-[0.4em]">
                    Access Granted
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          style={{ x: isMobile ? 0 : textX, y: isMobile ? 0 : textY }}
          className="relative mb-12 min-h-[160px] md:min-h-[240px] flex items-center justify-center"
        >
          {/* The Flying Blue Ball & Splash Effect */}
          <AnimatePresence>
            {showBall && phase === "typing" && !isSplashing && (
              <motion.div
                key="blue-ball"
                initial={{ x: -600, y: -300, scale: 0, opacity: 0 }}
                animate={{ 
                  x: 0, 
                  y: 0, 
                  scale: 1, 
                  opacity: 1 
                }}
                transition={{ 
                  duration: 0.7, 
                  ease: [0.34, 1.3, 0.64, 1] // Faster, heavy impact
                }}
                onAnimationComplete={() => {
                  setIsSplashing(true);
                  setTimeout(() => {
                    setPhase("final");
                    setShowBall(false);
                  }, 400);
                }}
                className="absolute w-14 h-14 bg-primary rounded-full z-50 shadow-[0_0_50px_rgba(0,240,255,0.8)]"
              />
            )}

            {isSplashing && (
              <div key="splash-container" className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                {splashParticles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ 
                      x: Math.cos(p.angle) * p.distance,
                      y: Math.sin(p.angle) * p.distance,
                      scale: [0, 1.5, 0.5],
                      opacity: [1, 1, 0]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      delay: p.delay,
                      ease: "circOut"
                    }}
                    className="absolute bg-primary rounded-full blur-[2px]"
                    style={{
                      width: p.size,
                      height: p.size,
                      filter: "blur(4px)"
                    }}
                  />
                ))}
                {/* Center "Splat" */}
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute w-20 h-20 bg-primary rounded-full blur-xl"
                />
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === "typing" ? (
              <motion.div
                key={`typing-${segmentIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(15px)" }}
                transition={{ duration: 0.3 }}
                className="text-3xl md:text-5xl font-light tracking-tight text-white/90 font-mono"
              >
                {displayText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle"
                />
              </motion.div>
            ) : (
              <motion.div
                key="final"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring", 
                  stiffness: 150,
                  damping: 15
                }}
                className="relative"
              >
                <motion.h1 
                  className="text-8xl md:text-[12rem] font-black tracking-tighter text-white leading-[0.8] relative"
                >
                  OK<span className="text-primary italic relative inline-block drop-shadow-[0_0_40px_rgba(0,240,255,0.4)]">
                    djw
                    <motion.span 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.3, duration: 1, ease: "easeInOut" }}
                      className="absolute bottom-4 left-0 h-[2px] bg-primary/30"
                    />
                  </span>
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl md:text-3xl font-light tracking-tight text-foreground/40 mt-8"
                >
                  {t("okdjw")}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={`flex flex-col items-center gap-10 transition-opacity duration-1000 ${phase === "typing" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <p className="max-w-2xl text-lg md:text-xl text-foreground/60 font-medium leading-relaxed">
            {t("description")}
            <span className="block text-primary/40 font-mono text-[10px] mt-4 uppercase tracking-[0.6em] font-bold">
              {t("slogan")}
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-4">
            <motion.a 
              href="#projects"
              onMouseEnter={() => setIsHoveredButton("projects")}
              onMouseLeave={() => setIsHoveredButton(null)}
              whileHover={{ 
                scale: 1.1, 
                backgroundColor: "#fff", 
                color: "#000",
                boxShadow: "0 0 40px rgba(0,240,255,0.5)"
              }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-primary text-black font-black rounded-full transition-all duration-300 text-xs uppercase tracking-[0.2em] relative overflow-hidden group flex items-center justify-center"
            >
              <span className="relative z-10">{t("viewProjects")}</span>
              <motion.div 
                className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"
              />
            </motion.a>

            <motion.a 
              href="https://wa.me/8618666680913"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setIsHoveredButton("contact")}
              onMouseLeave={() => setIsHoveredButton(null)}
              whileHover={{ 
                scale: 1.1, 
                borderColor: "rgba(0,240,255,0.5)",
                backgroundColor: "rgba(255,255,255,0.05)"
              }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 border border-white/10 transition-all duration-300 rounded-full font-black text-xs uppercase tracking-[0.2em] backdrop-blur-md relative group flex items-center justify-center"
            >
              <span className="relative z-10">{t("contactMe")}</span>
              <motion.div 
                className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
              />
            </motion.a>
          </div>
        </motion.div>
      </motion.div>

      {/* Interactive Background Glow */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-[1px] h-16 bg-gradient-to-b from-white/20 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.5em] text-foreground/20 font-bold">{t("scroll")}</span>
        </div>
      </motion.div>
    </section>
  );
};
