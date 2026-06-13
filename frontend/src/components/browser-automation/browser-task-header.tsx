"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getTaskInitials } from "@/config/browser-automation";
import type { BrowserTaskDetail } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { BrowserTaskStatusBadge } from "./browser-task-status-badge";

interface BrowserTaskHeaderProps {
  task: BrowserTaskDetail;
  actions?: React.ReactNode;
}

export function BrowserTaskHeader({ task, actions }: BrowserTaskHeaderProps) {
  const accent = dashboardAccents.blue;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <Link href="/browser-automation">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Browser Automation
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
            {getTaskInitials(task.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Browser Task
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
              {task.name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">{task.slug}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BrowserTaskStatusBadge status={task.status} />
              <Link
                href={`/browser-automation/profiles/${task.browser_profile_id}`}
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Profile: {task.profile_name}
              </Link>
            </div>
          </div>
        </div>

        {actions && <div className="w-full max-w-xs shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
