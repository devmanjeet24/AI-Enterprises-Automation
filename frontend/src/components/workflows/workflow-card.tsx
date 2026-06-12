"use client";

import { ArrowRight, GitBranch, Layers } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { getWorkflowInitials } from "@/config/workflows";
import type { Workflow } from "@/lib/workflows/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { WorkflowStatusBadge } from "./workflow-status-badge";

interface WorkflowCardProps {
  workflow: Workflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const accent = dashboardAccents.purple;

  return (
    <Link href={`/workflows/${workflow.id}`} className="block">
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
              {getWorkflowInitials(workflow.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {workflow.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {workflow.slug}
              </p>
            </div>
          </div>
          <WorkflowStatusBadge status={workflow.status} />
        </div>

        {workflow.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {workflow.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Layers className="size-3.5" />
            {workflow.steps.length} step{workflow.steps.length === 1 ? "" : "s"}
          </span>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <GitBranch className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
