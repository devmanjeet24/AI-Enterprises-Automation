"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image, { type StaticImageData } from "next/image";

import blueLinesImage from "@/assets/Images/light-to-blue-lines.svg";
import { defaultTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type FloatingCardVariant = "accent" | "glass" | "pill" | "metric";

export type FloatingCardConfig = {
  id: string;
  message: string;
  label?: string;
  variant: FloatingCardVariant;
  className: string;
  delay: number;
  floatDuration: number;
};

type LandingCircularVisualProps = {
  image: StaticImageData;
  cards: FloatingCardConfig[];
  showSparkles?: boolean;
};

export function LandingCircularVisual({
  image,
  cards,
  showSparkles = true,
}: LandingCircularVisualProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="relative mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl"
      aria-hidden
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={
          prefersReducedMotion ? undefined : { scale: 1.02, y: -4 }
        }
        transition={{ ...defaultTransition, duration: 0.9 }}
        className="relative aspect-square w-full"
      >
        <div
          className="pointer-events-none absolute inset-[12%] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(39,127,255,0.22) 0%, rgba(212,168,67,0.08) 45%, transparent 70%)",
          }}
        />

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...defaultTransition, delay: 0.15, duration: 0.8 }}
          className="pointer-events-none absolute -right-[6%] top-1/2 z-0 w-[48%] -translate-y-1/2 sm:-right-[4%] sm:w-[46%] md:-right-[2%] md:w-[44%] lg:w-[42%]"
        >
          <Image
            src={blueLinesImage}
            alt=""
            className="h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(39,127,255,0.25)]"
            priority
          />
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, delay: 0.2, duration: 0.85 }}
          className="absolute left-1/2 top-1/2 z-10 w-[62%] -translate-x-1/2 -translate-y-1/2 sm:w-[58%] md:w-[56%]"
        >
          <div className="relative aspect-square overflow-hidden rounded-full border border-white/15 bg-surface/40 p-1 shadow-[0_24px_64px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
            <div className="relative size-full overflow-hidden rounded-full">
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 640px) 220px, (max-width: 1024px) 280px, 320px"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>

          {showSparkles ? (
            <>
              <span className="absolute -right-1 top-[18%] text-lg text-brand sm:text-xl">
                ✦
              </span>
              <span className="absolute -left-2 bottom-[22%] text-sm text-brand/80 sm:text-base">
                ✦
              </span>
            </>
          ) : null}
        </motion.div>

        {cards.map((card) => (
          <FloatingInsightCard
            key={card.id}
            card={card}
            prefersReducedMotion={!!prefersReducedMotion}
          />
        ))}
      </motion.div>
    </div>
  );
}

function FloatingInsightCard({
  card,
  prefersReducedMotion,
}: {
  card: FloatingCardConfig;
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={
        prefersReducedMotion
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: [0, -8, 0], scale: 1 }
      }
      transition={
        prefersReducedMotion
          ? { ...defaultTransition, delay: card.delay }
          : {
              opacity: { ...defaultTransition, delay: card.delay },
              y: {
                duration: card.floatDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: card.delay + 0.8,
              },
              scale: { ...defaultTransition, delay: card.delay },
            }
      }
      whileHover={
        prefersReducedMotion ? undefined : { scale: 1.04, y: -4 }
      }
      className={cn("absolute", card.className)}
    >
      <div
        className={cn(
          "shadow-lg backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(39,127,255,0.2)]",
          card.variant === "accent" &&
            "rounded-2xl rounded-bl-md border border-sky-400/30 bg-sky-500/80 px-3.5 py-2.5 text-[11px] leading-snug text-white shadow-[0_8px_32px_rgba(39,127,255,0.35)] sm:px-4 sm:py-3 sm:text-xs md:text-[13px]",
          card.variant === "glass" &&
            "rounded-2xl rounded-tl-md border border-white/25 bg-white/10 px-3.5 py-2.5 text-[11px] leading-snug text-foreground/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:px-4 sm:py-3 sm:text-xs md:text-[13px]",
          card.variant === "pill" &&
            "rounded-full border border-brand/25 bg-brand/10 px-3 py-1.5 text-[10px] font-medium text-brand sm:text-[11px]",
          card.variant === "metric" &&
            "rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:px-4 sm:py-3",
        )}
      >
        {card.variant === "metric" ? (
          <>
            <p className="font-display text-lg leading-none text-brand sm:text-xl">
              {card.message}
            </p>
            {card.label ? (
              <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
                {card.label}
              </p>
            ) : null}
          </>
        ) : (
          card.message
        )}
      </div>
    </motion.div>
  );
}
