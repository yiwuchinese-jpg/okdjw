"use client";

import { useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export const CustomCursor = () => {
  // Use MotionValues for everything to avoid React re-renders
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);

  // High performance spring for that "snappier" feel (higher stiffness)
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Show cursor on first movement
    const onFirstMove = () => opacity.set(1);

    const moveCursor = (e: MouseEvent) => {
      // Direct set on MotionValue is extremely fast
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a") ||
        target.style.cursor === "pointer";

      if (isInteractable) {
        scale.set(2.5);
      } else {
        scale.set(1);
      }
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mousemove", onFirstMove, { once: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousemove", onFirstMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY, scale, opacity]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-primary pointer-events-none z-[9999] hidden md:block mix-blend-difference pointer-events-none"
      style={{
        x: smoothX,
        y: smoothY,
        scale: scale,
        opacity: opacity,
        translateX: "-50%",
        translateY: "-50%",
      }}
    />
  );
};
