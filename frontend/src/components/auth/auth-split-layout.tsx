"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { AuthBackground } from "@/components/auth/auth-background";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { siteConfig } from "@/config/site";
import { defaultTransition } from "@/lib/motion";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative isolate min-h-screen">
      <AuthBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 md:px-10 lg:px-16 xl:px-20">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...defaultTransition, duration: 0.7 }}
          className="w-full max-w-[1040px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c1220]/90 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="flex flex-col lg:flex-row">
            {/* Form — first on mobile */}
            <div className="order-1 flex w-full flex-col justify-center px-7 py-10 sm:px-10 sm:py-11 lg:w-[55%] lg:px-12 lg:py-14 xl:px-14">
              <div className="mb-9 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="text-sm font-semibold tracking-[-0.02em] text-foreground transition-opacity hover:opacity-80"
                >
                  {siteConfig.name}
                  <span className="font-normal text-muted-foreground">.ai</span>
                </Link>
                <Link
                  href="/"
                  className="shrink-0 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to home
                </Link>
              </div>

              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...defaultTransition, delay: 0.12 }}
              >
                {children}
              </motion.div>
            </div>

            {/* Showcase — below form on mobile */}
            <div className="order-2 relative w-full overflow-hidden border-t border-white/[0.06] bg-[#0a101c]/60 lg:w-[45%] lg:border-l lg:border-t-0">
              <div
                className="pointer-events-none absolute inset-0 z-10"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(39,127,255,0.1) 0%, transparent 70%)",
                }}
              />
              <AuthShowcasePanel />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
