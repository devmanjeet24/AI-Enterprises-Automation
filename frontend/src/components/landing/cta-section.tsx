"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

import { ScrollReveal } from "./scroll-reveal";

export function CtaSection() {
  return (
    <Section spacing="default" contained={true}>
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-2xl border border-border-strong glass-card px-8 py-16 text-center md:px-16 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(212,168,67,0.12), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="font-display text-3xl tracking-[-0.02em] text-foreground md:text-5xl">
              Ready to automate at{" "}
              <em className="text-brand-accent">enterprise scale?</em>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Join teams deploying AI employees with grounded knowledge,
              governed workflows, and full operational visibility.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button variant="brand" size="xl" asChild>
                <Link href={siteConfig.links.register}>
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link href={siteConfig.links.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}
