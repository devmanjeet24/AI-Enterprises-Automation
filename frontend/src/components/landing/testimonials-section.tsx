import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/config/landing";

import { LandingCard } from "./landing-card";
import { LandingSection } from "./landing-section";
import { ScrollReveal } from "./scroll-reveal";
import { StaggerGrid, StaggerItem } from "./stagger-grid";

export function TestimonialsSection() {
  return (
    <LandingSection id="resources" spacing="default" ambient="warm">
      <ScrollReveal>
        <SectionHeading
          overline="Resources"
          title="Trusted by operations"
          accent="leaders worldwide."
          description="See how teams use Lumen to automate complex work while maintaining enterprise governance."
        />
      </ScrollReveal>

      <StaggerGrid className="mt-14 grid gap-4 md:grid-cols-3 md:mt-16">
        {testimonials.map((t) => (
          <StaggerItem key={t.author}>
            <LandingCard className="flex flex-col p-6">
              <span
                className="font-display text-4xl leading-none text-brand/25 transition-colors duration-300 group-hover:text-brand/40"
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1 font-display text-lg leading-relaxed text-foreground">
                {t.quote}
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-brand-muted/50 text-xs font-semibold text-brand transition-colors duration-300 group-hover:border-brand/30">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </LandingCard>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </LandingSection>
  );
}
