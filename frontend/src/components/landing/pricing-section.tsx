import { Check } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { pricingPlans } from "@/config/landing";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

export function PricingSection() {
  return (
    <Section id="pricing" spacing="default" className="section-gradient">
      <ScrollReveal>
        <SectionHeading
          overline="Pricing"
          title="Plans that scale with"
          accent="your automation."
          description="Start free and upgrade as your team deploys more AI employees, workflows, and agent teams."
        />
      </ScrollReveal>

      <StaggerGrid className="mt-16 grid gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <StaggerItem key={plan.name}>
            <Card
              variant={plan.highlighted ? "featured" : "glass"}
              className={cn(
                "flex h-full flex-col p-8 transition-all duration-300",
                plan.highlighted && "scale-[1.02] lg:scale-105",
              )}
            >
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
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "brand" : "outline"}
                className="mt-8 w-full"
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
            </Card>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </Section>
  );
}
