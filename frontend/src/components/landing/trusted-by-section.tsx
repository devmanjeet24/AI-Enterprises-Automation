import { Section } from "@/components/layout/section";
import { trustedByLogos } from "@/config/landing";

import { ScrollReveal } from "./scroll-reveal";

export function TrustedBySection() {
  return (
    <Section spacing="compact" className="border-y border-border bg-elevated/50">
      <ScrollReveal>
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.1em] text-tertiary">
          Trusted by forward-thinking teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {trustedByLogos.map((logo) => (
            <span
              key={logo}
              className="text-sm font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              {logo}
            </span>
          ))}
        </div>
      </ScrollReveal>
    </Section>
  );
}
