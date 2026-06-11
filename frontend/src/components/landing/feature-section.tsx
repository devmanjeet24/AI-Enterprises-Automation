import { Check } from "lucide-react";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

import { MockUiPanel, type MockVariant } from "./mock-ui-panel";
import { ScrollReveal } from "./scroll-reveal";

type FeatureSectionProps = {
  id?: string;
  overline: string;
  title: string;
  accent?: string;
  description: string;
  bullets: string[];
  mockVariant: MockVariant;
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
  reversed = false,
  className,
}: FeatureSectionProps) {
  return (
    <Section id={id} spacing="default" className={className}>
      <div
        className={cn(
          "grid items-center gap-12 lg:grid-cols-2 lg:gap-20",
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
          <ul className="mt-8 space-y-3">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                {bullet}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <MockUiPanel variant={mockVariant} />
        </ScrollReveal>
      </div>
    </Section>
  );
}
