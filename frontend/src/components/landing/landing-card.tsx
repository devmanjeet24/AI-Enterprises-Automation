"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface LandingCardProps {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
  interactive?: boolean;
}

export function LandingCard({
  children,
  className,
  featured = false,
  interactive = true,
}: LandingCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        interactive && !prefersReducedMotion ? { y: -3, scale: 1.005 } : undefined
      }
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "premium-card group relative h-full",
        featured && "premium-card-featured",
        className,
      )}
    >
      <div
        className={cn(
          "premium-card-glow pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500",
          featured ? "opacity-50" : "opacity-0 group-hover:opacity-100",
        )}
      />
      <div className="relative h-full">{children}</div>
    </motion.div>
  );
}

interface LandingIconBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function LandingIconBox({ children, className }: LandingIconBoxProps) {
  return (
    <div
      className={cn(
        "mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-brand-muted/60 transition-all duration-300 group-hover:border-brand/35 group-hover:bg-brand-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}
