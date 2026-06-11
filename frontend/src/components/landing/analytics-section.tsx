import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { analyticsStats } from "@/config/landing";

import { MockUiPanel } from "./mock-ui-panel";
import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

export function AnalyticsSection() {
  return (
    <Section spacing="default" className="section-gradient">
      <ScrollReveal>
        <SectionHeading
          overline="Analytics"
          title="Visibility into every"
          accent="automated action."
          description="Track task volumes, success rates, and agent performance from a unified analytics dashboard."
        />
      </ScrollReveal>

      <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <StaggerGrid className="grid grid-cols-2 gap-4">
          {analyticsStats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="glass-card p-6 text-center transition-all duration-300 hover:border-border-strong">
                <p className="font-display text-3xl text-brand md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>

        <ScrollReveal delay={0.15}>
          <MockUiPanel variant="analytics" />
        </ScrollReveal>
      </div>
    </Section>
  );
}
