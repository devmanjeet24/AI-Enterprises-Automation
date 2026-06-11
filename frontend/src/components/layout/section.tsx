import * as React from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerSize?: "default" | "narrow" | "wide";
  spacing?: "default" | "compact" | "hero";
  contained?: boolean;
}

const spacingClasses = {
  compact: "py-16 md:py-20",
  default: "py-24 md:py-32",
  hero: "pt-32 pb-24 md:pt-40 md:pb-32",
};

function Section({
  className,
  containerSize = "default",
  spacing = "default",
  contained = true,
  children,
  ...props
}: SectionProps) {
  const content = contained ? (
    <Container size={containerSize}>{children}</Container>
  ) : (
    children
  );

  return (
    <section
      className={cn("relative w-full", spacingClasses[spacing], className)}
      {...props}
    >
      {content}
    </section>
  );
}

export { Section };
