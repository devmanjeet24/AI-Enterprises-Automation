"use client";

import { ArrowRight, Loader2, Network } from "lucide-react";
import Link from "next/link";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate } from "@/config/teams";
import type { Team } from "@/lib/teams/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { TeamStatusBadge } from "../teams/team-status-badge";

interface DepartmentLinkedTeamsProps {
  teams: Team[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  canCreate?: boolean;
}

export function DepartmentLinkedTeams({
  teams,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  canCreate = false,
}: DepartmentLinkedTeamsProps) {
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
        Loading linked teams…
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
        <p className="text-[15px] font-medium text-foreground">Failed to load linked teams</p>
        <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
          {errorMessage ?? "Could not load teams for this department."}
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

  if (teams.length === 0) {
    return (
      <DashboardCard
        variant="panel"
        accent="blue"
        interactive={false}
        className="flex flex-col items-center px-6 py-16 text-center"
      >
        <Network className="size-8 text-tertiary" />
        <h3 className="mt-4 text-[15px] font-medium text-foreground">No linked teams</h3>
        <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
          {canCreate
            ? "Create an org team under this department to see it listed here."
            : "No org teams belong to this department yet."}
        </p>
        {canCreate && (
          <Link
            href="/settings/teams"
            className="mt-4 text-[13px] font-medium text-brand hover:underline"
          >
            Go to Teams settings
          </Link>
        )}
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <Link key={team.id} href={`/settings/teams/${team.id}`} className="block">
          <DashboardCard variant="panel" accent="blue" className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-medium text-foreground group-hover/card:text-brand">
                    {team.name}
                  </p>
                  <TeamStatusBadge isActive={team.is_active} />
                </div>
                <p className="mt-1 font-mono text-[12px] text-tertiary">{team.slug}</p>
                {team.description && (
                  <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">
                    {team.description}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-tertiary">
                  Updated {formatRelativeDate(team.updated_at)}
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
