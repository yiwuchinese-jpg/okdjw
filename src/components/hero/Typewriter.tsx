"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface TypewriterProps {
  texts: string[];
  delay?: number;
}

export const Typewriter = ({ texts, delay = 3000 }: TypewriterProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, delay);
    return () => clearInterval(timer);
  }, [texts, delay]);

  return (
    <div className="relative h-[1.2em] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -20, opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute left-0 right-0 text-primary font-bold"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
