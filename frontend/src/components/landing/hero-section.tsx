"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { heroVideoUrl, trustedByLogos } from "@/config/landing";
import { siteConfig } from "@/config/site";
import { defaultTransition } from "@/lib/motion";

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="bg-[#eef1f8] pb-16 md:pb-24 lg:pb-32">
      <section className="relative isolate min-h-[92vh] overflow-hidden rounded-b-[3rem] shadow-[0_24px_80px_rgba(10,15,26,0.12)] md:min-h-[94vh] md:rounded-b-[4rem] lg:rounded-b-[5rem] xl:rounded-b-[5.5rem]">
        {/* Background video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="size-full object-cover"
            aria-hidden
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        </div>

        {/* Light overlay — left-side gradient only for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(10,15,26,0.55) 0%, rgba(10,15,26,0.28) 42%, rgba(10,15,26,0.08) 68%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/35 via-transparent to-transparent" />
        {/* Top scrim — improves navbar + headline contrast without darkening video */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0a0f1a]/25 to-transparent" />

        <Container className="relative flex min-h-[92vh] flex-col justify-between pb-12 pt-28 md:min-h-[94vh] md:pb-16 md:pt-32">
          {/* Main copy — left-aligned, compact */}
          <div className="max-w-lg pt-10 md:max-w-xl md:pt-20 lg:pt-24">
            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={defaultTransition}
              className="hero-text-shadow text-4xl font-semibold leading-[1.14] tracking-[-0.03em] text-white md:text-[2.75rem] lg:text-[3.25rem]"
            >
              Your enterprise platform for{" "}
              <span className="text-brand">AI agents</span>
            </motion.h1>

            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...defaultTransition, delay: 0.08 }}
              className="hero-text-shadow mt-6 max-w-md text-[15px] leading-[1.65] text-white/90 md:text-base"
            >
              Deploy and govern AI employees with grounded knowledge and
              enterprise controls.
            </motion.p>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...defaultTransition, delay: 0.16 }}
              className="mt-10"
            >
              <Button variant="brand" size="lg" asChild>
                <Link href={siteConfig.links.register}>
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Trusted by — inside hero, bottom */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...defaultTransition, delay: 0.24 }}
            className="mt-20 border-t border-white/20 pt-10 md:mt-0"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/75">
              Trusted by forward-thinking teams
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
              {trustedByLogos.map((logo) => (
                <span
                  key={logo}
                  className="text-sm font-medium text-white/60 transition-colors hover:text-white/90"
                >
                  {logo}
                </span>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
