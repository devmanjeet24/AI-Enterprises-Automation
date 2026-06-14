"use client";

import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface AnalyticsHeroStat {
  label: string;
  value: string;
}

interface AnalyticsHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  stats?: AnalyticsHeroStat[];
  isLoading?: boolean;
}

export function AnalyticsHero({
  eyebrow = "Analytics",
  title,
  description,
  stats = [],
  isLoading = false,
}: AnalyticsHeroProps) {
  const accent = dashboardAccents.emerald;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {stats.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
            {stats.map(({ label, value }) => (
              <div key={label}>
                <p className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                  {isLoading ? "—" : value}
                </p>
                <p className={cn("mt-1 text-[12px]", accent.textMuted)}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
