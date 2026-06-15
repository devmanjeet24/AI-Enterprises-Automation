import type { ReactNode } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

import { BulletList } from "./bullet-list";
import { LandingSection } from "./landing-section";
import { MockUiPanel, type MockVariant } from "./mock-ui-panel";
import { ScrollReveal } from "./scroll-reveal";

type FeatureSectionProps = {
  id?: string;
  overline: string;
  title: string;
  accent?: string;
  description: string;
  bullets: string[];
  mockVariant?: MockVariant;
  visual?: ReactNode;
  reversed?: boolean;
  className?: string;
};

export function FeatureSection({
  id,
  overline,
  title,
  accent,
  description,
  bullets,
  mockVariant,
  visual,
  reversed = false,
  className,
}: FeatureSectionProps) {
  return (
    <LandingSection
      id={id}
      spacing="default"
      ambient={reversed ? "cool" : "warm"}
      className={className}
    >
      <div
        className={cn(
          "grid items-center gap-14 lg:grid-cols-2 lg:gap-20",
          reversed && "lg:[&>*:first-child]:order-2",
        )}
      >
        <ScrollReveal>
          <SectionHeading
            align="left"
            overline={overline}
            title={title}
            accent={accent}
            description={description}
          />
          <BulletList items={bullets} />
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          {visual ?? <MockUiPanel variant={mockVariant!} />}
        </ScrollReveal>
      </div>
    </LandingSection>
  );
}
