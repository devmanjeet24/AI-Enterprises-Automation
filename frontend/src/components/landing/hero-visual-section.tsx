"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";

export function HeroVisualSection() {
  return (
    <section className="relative bg-background">
      <Container size="wide" className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative mx-auto max-w-5xl"
        >
          <HeroVisual />
        </motion.div>
      </Container>

      {/* Gradient exit — sits below the card, not over it */}
      <div className="hero-visual-exit pointer-events-none relative mt-8 h-10 md:mt-10 md:h-14" aria-hidden>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212, 168, 67, 0.08), transparent 70%)",
          }}
        />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="glass-card relative aspect-[16/9] overflow-hidden">
      {/* glow */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.78 0.18 95 / 0.25), transparent 60%)",
        }}
      />
      {/* concentric rings */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          {[280, 380, 480, 580].map((s, i) => (
            <div
              key={s}
              className="absolute rounded-full border border-border animate-spin-slow"
              style={{
                width: s,
                height: s,
                left: -s / 2,
                top: -s / 2,
                animationDuration: `${30 + i * 10}s`,
                animationDirection: i % 2 ? "reverse" : "normal",
              }}
            >
              <div
                className="absolute size-2 rounded-full bg-[var(--brand)]"
                style={{ top: -4, left: "50%" }}
              />
            </div>
          ))}
          <div
            className="relative size-32 rounded-full bg-[var(--gradient-brand)] grid place-items-center animate-pulse-glow"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div className="size-20 rounded-full glass-card grid place-items-center">
              <Sparkles className="size-7 text-background" />
            </div>
          </div>
        </div>
      </div>

      {/* floating chips */}
      {[
        { t: "Resolve ticket", x: "8%", y: "18%", d: 0 },
        { t: "Summarize call", x: "78%", y: "22%", d: 0.3 },
        { t: "Generate quote", x: "12%", y: "70%", d: 0.6 },
        { t: "Route to agent", x: "76%", y: "72%", d: 0.9 },
        { t: "Update CRM", x: "44%", y: "12%", d: 1.2 },
      ].map((c) => (
        <motion.div
          key={c.t}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + c.d, duration: 0.6 }}
          className="absolute glass-card px-3 py-1.5 text-xs text-muted-foreground"
          style={{ left: c.x, top: c.y }}
        >
          <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-[var(--brand)]" />
          {c.t}
        </motion.div>
      ))}
    </div>
  );
}
