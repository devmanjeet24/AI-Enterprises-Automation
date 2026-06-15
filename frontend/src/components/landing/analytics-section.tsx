import { SectionHeading } from "@/components/ui/section-heading";
import { analyticsStats } from "@/config/landing";

import { AnalyticsSectionVisual } from "./analytics-section-visual";
import { LandingCard } from "./landing-card";
import { LandingSection } from "./landing-section";
import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

export function AnalyticsSection() {
  return (
    <LandingSection spacing="default" ambient="cool" subtleGradient>
      <ScrollReveal>
        <SectionHeading
          overline="Analytics"
          title="Visibility into every"
          accent="automated action."
          description="Track task volumes, success rates, and agent performance from a unified analytics dashboard."
        />
      </ScrollReveal>

      <div className="mt-14 grid items-center gap-14 lg:grid-cols-2 lg:gap-20 md:mt-16">
        <StaggerGrid className="grid grid-cols-2 gap-3">
          {analyticsStats.map((stat) => (
            <StaggerItem key={stat.label}>
              <LandingCard className="p-6 text-center">
                <p className="font-display text-3xl text-brand transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(245,197,24,0.35)] md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </LandingCard>
            </StaggerItem>
          ))}
        </StaggerGrid>

        <ScrollReveal delay={0.12}>
          <AnalyticsSectionVisual />
        </ScrollReveal>
      </div>
    </LandingSection>
  );
}
