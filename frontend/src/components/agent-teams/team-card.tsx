"use client";

import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { getTeamInitials } from "@/config/agent-teams";
import type { AgentTeam, AgentTeamDetail } from "@/lib/agent-teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { TeamStatusBadge } from "./team-status-badge";

interface TeamCardProps {
  team: AgentTeam;
  memberCount?: number;
}

export function TeamCard({ team, memberCount }: TeamCardProps) {
  const accent = dashboardAccents.blue;

  return (
    <Link href={`/agent-teams/${team.id}`} className="block">
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
              {getTeamInitials(team.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {team.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {team.slug}
              </p>
            </div>
          </div>
          <TeamStatusBadge isActive={team.is_active} />
        </div>

        {team.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {team.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Users className="size-3.5" />
            {memberCount != null
              ? `${memberCount} member${memberCount === 1 ? "" : "s"}`
              : "View members"}
          </span>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
      </DashboardCard>
    </Link>
  );
}

export function getMemberCountForTeam(
  team: AgentTeam,
  details?: AgentTeamDetail[],
): number | undefined {
  const detail = details?.find((d) => d.id === team.id);
  return detail?.members.length;
}
