import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/config/landing";

import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

export function TestimonialsSection() {
  return (
    <Section id="resources" spacing="default">
      <ScrollReveal>
        <SectionHeading
          overline="Resources"
          title="Trusted by operations"
          accent="leaders worldwide."
          description="See how teams use Lumen to automate complex work while maintaining enterprise governance."
        />
      </ScrollReveal>

      <StaggerGrid className="mt-16 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <StaggerItem key={t.author}>
            <Card
              variant="glass"
              className="flex h-full flex-col p-6 transition-all duration-300 hover:border-border-strong"
            >
              <blockquote className="flex-1 font-display text-lg leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">{t.author}</p>
                <p className="text-xs text-muted-foreground">
                  {t.role}, {t.company}
                </p>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </Section>
  );
}
