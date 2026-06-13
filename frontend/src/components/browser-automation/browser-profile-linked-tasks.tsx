"use client";

import { ArrowRight, Globe, Loader2 } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate, truncateUrl } from "@/config/browser-automation";
import type { BrowserTask } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { BrowserTaskStatusBadge } from "./browser-task-status-badge";

interface BrowserProfileLinkedTasksProps {
  tasks: BrowserTask[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function BrowserProfileLinkedTasks({
  tasks,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: BrowserProfileLinkedTasksProps) {
  const accent = dashboardAccents.blue;

  if (isLoading) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
        interactive={false}
        className="flex items-center justify-center gap-2 px-6 py-16 text-[13px] text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" />
        Loading linked tasks…
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
        interactive={false}
        className="flex flex-col items-center px-6 py-12 text-center"
      >
        <p className="text-[15px] font-medium text-foreground">Failed to load linked tasks</p>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          {errorMessage ?? "Could not load tasks for this profile."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[13px] font-medium text-brand hover:underline"
          >
            Try again
          </button>
        )}
      </DashboardCard>
    );
  }

  if (tasks.length === 0) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <Globe className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">No linked tasks</h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          Create a browser task and assign this profile to see it listed here.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/browser-automation/tasks/${task.id}`}
          className="block"
        >
          <DashboardCard variant="panel" accent="blue" className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-medium text-foreground group-hover/card:text-brand">
                    {task.name}
                  </p>
                  <BrowserTaskStatusBadge status={task.status} />
                </div>
                <p className="mt-1 font-mono text-[12px] text-tertiary">{task.slug}</p>
                <p className="mt-2 line-clamp-1 font-mono text-[11px] text-muted-foreground">
                  {truncateUrl(task.target_url)}
                </p>
                <p className="mt-2 text-[11px] text-tertiary">
                  Updated {formatRelativeDate(task.updated_at)}
                </p>
              </div>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 text-[12px] font-medium",
                  accent.text,
                )}
              >
                Open
                <ArrowRight className="size-3" />
              </span>
            </div>
          </DashboardCard>
        </Link>
      ))}
    </div>
  );
}
