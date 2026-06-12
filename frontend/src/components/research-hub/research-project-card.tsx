"use client";

import { ArrowRight, FileText, Search } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatRelativeDate,
  getProjectInitials,
  researchTemplateLabels,
} from "@/config/research-hub";
import type { ResearchProject } from "@/lib/research-hub/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { ResearchProjectStatusBadge } from "./research-project-status-badge";

interface ResearchProjectCardProps {
  project: ResearchProject;
}

export function ResearchProjectCard({ project }: ResearchProjectCardProps) {
  const accent = dashboardAccents.purple;

  return (
    <Link href={`/research-hub/${project.id}`} className="block">
      <DashboardCard variant="default" accent="purple" className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border text-[12px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getProjectInitials(project.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {project.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {project.slug}
              </p>
            </div>
          </div>
          <ResearchProjectStatusBadge status={project.status} />
        </div>

        {project.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <FileText className="size-3.5" />
              {researchTemplateLabels[project.template_type]}
            </span>
            <span className="text-[11px] text-tertiary">
              Updated {formatRelativeDate(project.updated_at)}
            </span>
          </div>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <Search className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
