"use client";

import { ArrowLeft, Network } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getTeamInitials } from "@/config/agent-teams";
import {
  useAgentTeam,
  useAgentTeamTasks,
} from "@/hooks/use-agent-teams";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { AgentTeamsError } from "./agent-teams-error";
import { AgentTeamsStats } from "./agent-teams-stats";
import { TeamConfigPanel } from "./team-config-panel";
import { TeamDetailActions } from "./team-detail-actions";
import { TeamDetailTabs, type TeamDetailTab } from "./team-detail-tabs";
import { TeamExecutionHistory } from "./team-execution-history";
import { TeamExecutionPanel } from "./team-execution-panel";
import { TeamDetailSkeleton } from "./team-list-skeleton";
import { TeamMemberAssignment } from "./team-member-assignment";
import { TeamSetupChecklist } from "./team-setup-checklist";
import { TeamStatusBadge } from "./team-status-badge";

interface AgentTeamDetailPageProps {
  teamId: string;
}

export function AgentTeamDetailPage({ teamId }: AgentTeamDetailPageProps) {
  const accent = dashboardAccents.blue;
  const [activeTab, setActiveTab] = useState<TeamDetailTab>("configure");
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.AGENT_TEAMS_WRITE);
  const canDelete = hasPermission(permissions, PERMISSIONS.AGENT_TEAMS_DELETE);
  const canExecute = hasPermission(permissions, PERMISSIONS.AGENT_TEAMS_EXECUTE);

  const {
    data: team,
    isLoading: isTeamLoading,
    isError: isTeamError,
    error: teamError,
    refetch: refetchTeam,
  } = useAgentTeam(teamId);

  const {
    tasks,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useAgentTeamTasks(teamId);

  if (isTeamLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <TeamDetailSkeleton />
      </div>
    );
  }

  if (isTeamError) {
    if (teamError instanceof ApiError && teamError.status === 404) {
      notFound();
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <AgentTeamsError
          title="Failed to load team"
          message={getApiErrorMessage(teamError, "Could not load this agent team.")}
          onRetry={() => refetchTeam()}
        />
      </div>
    );
  }

  if (!team) notFound();

  const sequenceOrders = team.members.map((member) => member.sequence_order);
  const hasUniqueSequence =
    sequenceOrders.length === new Set(sequenceOrders).size;

  return (
    <div className="pb-10 md:pb-12">
      <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
        <Link href="/agent-teams">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            Back to Agent Teams
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
              {getTeamInitials(team.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                Agent Team
              </p>
              <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
                {team.name}
              </h1>
              <p className="mt-1 font-mono text-[13px] text-muted-foreground">
                {team.slug}
              </p>
              <div className="mt-3">
                <TeamStatusBadge isActive={team.is_active} />
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs shrink-0">
            <TeamDetailActions
              team={team}
              canWrite={canWrite}
              canDelete={canDelete}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <AgentTeamsStats teams={[team]} details={[team]} tasks={tasks} />
        <TeamSetupChecklist team={team} hasUniqueSequence={hasUniqueSequence} />
        <TeamDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "configure" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <TeamConfigPanel team={team} canWrite={canWrite} />
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-2">
                <Network className={cn("size-4", accent.text)} />
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
                  Pipeline summary
                </p>
              </div>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="font-medium text-foreground">{team.members.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tasks</dt>
                  <dd className="font-medium text-foreground">{tasks.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Execution ready</dt>
                  <dd className="font-medium text-foreground">
                    {team.is_active && team.members.length > 0 && hasUniqueSequence
                      ? "Yes"
                      : "No"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <TeamMemberAssignment team={team} canWrite={canWrite} />
        )}
        {activeTab === "execute" && (
          <>
            {isTasksError ? (
              <AgentTeamsError
                title="Failed to load tasks"
                message={getApiErrorMessage(tasksError, "Could not load team tasks.")}
                onRetry={() => refetchTasks()}
              />
            ) : (
              <TeamExecutionPanel
                team={team}
                tasks={tasks}
                tasksLoading={isTasksLoading}
                canExecute={canExecute}
              />
            )}
          </>
        )}
        {activeTab === "history" && (
          <>
            {isTasksError ? (
              <AgentTeamsError
                title="Failed to load execution history"
                message={getApiErrorMessage(
                  tasksError,
                  "Could not load execution history.",
                )}
                onRetry={() => refetchTasks()}
              />
            ) : (
              <TeamExecutionHistory tasks={tasks} isLoading={isTasksLoading} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
