import {
  BookOpen,
  Bot,
  Globe,
  Network,
  Search,
  Workflow,
} from "lucide-react";

import { SectionHeading } from "@/components/ui/section-heading";
import { platformCapabilities } from "@/config/landing";

import { LandingCard, LandingIconBox } from "./landing-card";
import { LandingSection } from "./landing-section";
import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

const iconMap = {
  users: Bot,
  book: BookOpen,
  network: Network,
  workflow: Workflow,
  search: Search,
  browser: Globe,
} as const;

export function PlatformOverviewSection() {
  return (
    <LandingSection
      id="platform"
      spacing="connected"
      ambient="brand"
      subtleGradient
    >
      <ScrollReveal>
        <SectionHeading
          overline="Platform"
          title="One platform for"
          accent="enterprise automation."
          description="Deploy AI employees, orchestrate agents, automate workflows, and govern everything from a single control plane."
        />
      </ScrollReveal>

      <StaggerGrid className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
        {platformCapabilities.map((cap) => {
          const Icon = iconMap[cap.icon];
          return (
            <StaggerItem key={cap.title}>
              <LandingCard className="p-6">
                <LandingIconBox>
                  <Icon className="size-5 text-brand transition-transform duration-300 group-hover:scale-110" />
                </LandingIconBox>
                <h3 className="text-base font-medium text-foreground transition-colors duration-300 group-hover:text-foreground">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {cap.description}
                </p>
              </LandingCard>
            </StaggerItem>
          );
        })}
      </StaggerGrid>
    </LandingSection>
  );
}
