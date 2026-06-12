"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { pricingPlans } from "@/config/landing";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { LandingCard } from "./landing-card";
import { LandingSection } from "./landing-section";
import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

export function PricingSection() {
  return (
    <LandingSection id="pricing" spacing="default" ambient="brand" subtleGradient>
      <ScrollReveal>
        <SectionHeading
          overline="Pricing"
          title="Plans that scale with"
          accent="your automation."
          description="Start free and upgrade as your team deploys more AI employees, workflows, and agent teams."
        />
      </ScrollReveal>

      <StaggerGrid className="mt-14 grid gap-4 lg:grid-cols-3 md:mt-16">
        {pricingPlans.map((plan) => (
          <StaggerItem key={plan.name}>
            <LandingCard
              featured={plan.highlighted}
              className={cn(
                "flex flex-col p-8",
                plan.highlighted && "lg:-mt-2 lg:mb-2",
              )}
            >
              {plan.highlighted ? (
                <span className="mb-4 inline-flex w-fit rounded-full border border-brand/30 bg-brand-muted/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  Most popular
                </span>
              ) : (
                <span className="mb-4 block h-[22px]" aria-hidden />
              )}
              <h3 className="text-lg font-medium text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-tertiary">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand-muted/40">
                      <Check className="size-2.5 text-brand" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "brand" : "outline"}
                className="mt-8 w-full transition-transform duration-300 hover:scale-[1.02]"
                asChild
              >
                <Link
                  href={
                    plan.name === "Enterprise"
                      ? siteConfig.links.demo
                      : siteConfig.links.register
                  }
                >
                  {plan.cta}
                </Link>
              </Button>
            </LandingCard>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </LandingSection>
  );
}
