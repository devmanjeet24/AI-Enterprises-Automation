"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getProjectInitials } from "@/config/research-hub";
import type { ResearchProjectDetail } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ResearchProjectStatusBadge } from "./research-project-status-badge";

interface ResearchProjectHeaderProps {
  project: ResearchProjectDetail;
  actions?: React.ReactNode;
}

export function ResearchProjectHeader({ project, actions }: ResearchProjectHeaderProps) {
  const accent = dashboardAccents.purple;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <Link href="/research-hub">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Research Hub
        </Button>
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold",
              accent.bgSubtle,
              accent.border,
              accent.text,
            )}
          >
            {getProjectInitials(project.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Research Project
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
              {project.name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">
              {project.slug}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ResearchProjectStatusBadge status={project.status} />
              <Link
                href={`/agent-teams/${project.agent_team_id}`}
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Team: {project.agent_team_name}
              </Link>
            </div>
          </div>
        </div>

        {actions && <div className="w-full max-w-xs shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
