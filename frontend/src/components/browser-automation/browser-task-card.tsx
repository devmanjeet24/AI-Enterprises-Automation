"use client";

import { ArrowRight, Globe, Link2 } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatRelativeDate,
  getTaskInitials,
  truncateUrl,
} from "@/config/browser-automation";
import type { BrowserProfile, BrowserTask } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { BrowserTaskStatusBadge } from "./browser-task-status-badge";

interface BrowserTaskCardProps {
  task: BrowserTask;
  profiles: BrowserProfile[];
}

export function BrowserTaskCard({ task, profiles }: BrowserTaskCardProps) {
  const accent = dashboardAccents.blue;
  const profile = profiles.find((item) => item.id === task.browser_profile_id);

  return (
    <Link href={`/browser-automation/tasks/${task.id}`} className="block">
      <DashboardCard variant="default" accent="blue" className="h-full p-5">
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
              {getTaskInitials(task.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {task.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">{task.slug}</p>
            </div>
          </div>
          <BrowserTaskStatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <Link2 className="mt-0.5 size-3.5 shrink-0 text-tertiary" />
          <p className="line-clamp-1 font-mono text-[11px] text-muted-foreground">
            {truncateUrl(task.target_url)}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Globe className="size-3.5" />
            {profile?.name ?? "Unknown profile"}
          </span>
          <span
            className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}
          >
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}
