import { Section, type SectionProps } from "@/components/layout/section";
import { cn } from "@/lib/utils";

import { SectionAmbient } from "./section-ambient";

type AmbientVariant = "default" | "warm" | "cool" | "brand" | "none";

interface LandingSectionProps extends SectionProps {
  ambient?: AmbientVariant;
  subtleGradient?: boolean;
}

export function LandingSection({
  ambient = "default",
  subtleGradient = false,
  className,
  children,
  ...props
}: LandingSectionProps) {
  return (
    <Section
      className={cn(
        "overflow-hidden",
        subtleGradient && "section-gradient",
        className,
      )}
      {...props}
    >
      {ambient !== "none" ? <SectionAmbient variant={ambient} /> : null}
      <div className="relative">{children}</div>
    </Section>
  );
}
