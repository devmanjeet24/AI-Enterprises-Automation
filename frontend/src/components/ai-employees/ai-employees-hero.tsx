"use client";

import { Bot, Plus, UserX, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeEmployeeStats } from "@/config/ai-employees";
import type { AIEmployee } from "@/lib/ai-employees/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface AiEmployeesHeroProps {
  employees: AIEmployee[];
  canCreate?: boolean;
  onCreateClick: () => void;
}

export function AiEmployeesHero({
  employees,
  canCreate = true,
  onCreateClick,
}: AiEmployeesHeroProps) {
  const accent = dashboardAccents.emerald;
  const stats = computeEmployeeStats(employees);

  const heroStats = [
    { icon: Users, label: "Total", value: stats.total },
    { icon: Bot, label: "Active", value: stats.active },
    { icon: UserX, label: "Inactive", value: stats.inactive },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            AI Employee Studio
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Your team of{" "}
            <span className={accent.text}>intelligent agents</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Configure AI employees with knowledge and tools, then chat with
            grounded, citation-backed responses.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
          {heroStats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl border",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <Icon className={cn("size-4", accent.text)} />
              </div>
              <div>
                <p className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {canCreate && (
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Create employee
          </Button>
        )}
        <p className="text-[12px] text-tertiary">
          Assign embedded docs → Activate → Chat
        </p>
      </div>
    </section>
  );
}
