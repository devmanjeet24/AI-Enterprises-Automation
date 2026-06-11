import {
  BookOpen,
  Bot,
  Globe,
  Network,
  Search,
  Workflow,
} from "lucide-react";

import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { platformCapabilities } from "@/config/landing";

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
    <Section id="platform" spacing="default" className="section-gradient">
      <ScrollReveal>
        <SectionHeading
          overline="Platform"
          title="One platform for"
          accent="enterprise automation."
          description="Deploy AI employees, orchestrate agents, automate workflows, and govern everything from a single control plane."
        />
      </ScrollReveal>

      <StaggerGrid className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platformCapabilities.map((cap) => {
          const Icon = iconMap[cap.icon];
          return (
            <StaggerItem key={cap.title}>
              <Card
                variant="glass"
                className="group h-full p-6 transition-all duration-300 hover:border-border-strong hover:shadow-glow-sm"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-brand-muted transition-colors group-hover:border-brand/30">
                  <Icon className="size-5 text-brand" />
                </div>
                <h3 className="text-base font-medium text-foreground">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {cap.description}
                </p>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerGrid>
    </Section>
  );
}
