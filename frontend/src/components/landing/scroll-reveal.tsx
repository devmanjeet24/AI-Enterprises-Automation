"use client";

import { motion, useReducedMotion } from "framer-motion";

import { defaultTransition, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeInUp}
      transition={{ ...defaultTransition, delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
