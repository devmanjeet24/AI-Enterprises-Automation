"use client";

import { motion, useReducedMotion } from "framer-motion";

import { defaultTransition, fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerGrid({ children, className }: StaggerGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainer}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={defaultTransition}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
