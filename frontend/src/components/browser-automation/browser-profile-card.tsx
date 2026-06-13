import { ArrowRight, CheckCircle2, CircleOff } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  countTasksForProfile,
  formatRelativeDate,
  formatViewport,
  getProfileInitials,
} from "@/config/browser-automation";
import type { BrowserProfile, BrowserTask } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface BrowserProfileCardProps {
  profile: BrowserProfile;
  tasks: BrowserTask[];
}

export function BrowserProfileCard({ profile, tasks }: BrowserProfileCardProps) {
  const accent = dashboardAccents.blue;
  const taskCount = countTasksForProfile(tasks, profile.id);
  const viewport = formatViewport(profile.viewport_width, profile.viewport_height);

  return (
    <Link href={`/browser-automation/profiles/${profile.id}`} className="block">
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
              {getProfileInitials(profile.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {profile.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">{profile.slug}</p>
            </div>
          </div>
          {profile.is_active ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="size-3" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] font-medium text-tertiary">
              <CircleOff className="size-3" />
              Inactive
            </span>
          )}
        </div>

        {profile.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {profile.description}
          </p>
        )}

        <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-[12px] text-muted-foreground">
          {viewport && <p>Viewport: {viewport}</p>}
          {profile.user_agent && (
            <p className="line-clamp-1 font-mono text-[11px] text-tertiary">{profile.user_agent}</p>
          )}
          <div className="flex items-center justify-between">
            <span>
              {taskCount} task{taskCount === 1 ? "" : "s"}
            </span>
            <span className={cn("flex items-center gap-1 font-medium", accent.text)}>
              Open
              <ArrowRight className="size-3" />
            </span>
          </div>
        </div>
      </DashboardCard>
    </Link>
  );
}
