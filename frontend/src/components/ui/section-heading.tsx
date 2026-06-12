import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  overline?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  accent?: React.ReactNode;
}

function SectionHeading({
  overline,
  title,
  description,
  align = "center",
  accent,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        align === "left" && "items-start text-left",
        className,
      )}
      {...props}
    >
      {overline ? (
        <p className="inline-flex items-center rounded-full border border-border bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-tertiary backdrop-blur-sm">
          {overline}
        </p>
      ) : null}

      <h2 className="max-w-3xl font-display text-4xl leading-[1.1] tracking-[-0.02em] text-foreground md:text-5xl lg:text-[3.25rem]">
        {title}
        {accent ? (
          <>
            {" "}
            <em className="font-display text-brand-accent">{accent}</em>
          </>
        ) : null}
      </h2>

      {description ? (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { SectionHeading };
