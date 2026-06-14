"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { TaskStatusBadge } from "@/components/agent-teams/task-status-badge";
import { DashboardCard, DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/research-hub";
import type { AgentTask } from "@/lib/agent-teams/types";

interface AnalyticsRecentTasksTableProps {
  tasks: AgentTask[];
  teamNames?: Map<string, string>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AnalyticsRecentTasksTable({
  tasks,
  teamNames,
  isLoading = false,
  emptyMessage = "Recent agent tasks will appear here.",
}: AnalyticsRecentTasksTableProps) {
  return (
    <DashboardCard variant="panel" accent="blue" className="h-full" interactive={false}>
      <DashboardCardHeader
        title="Recent tasks"
        subtitle="Latest multi-agent task submissions"
        accent="blue"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.06em] text-tertiary">
              <th className="px-5 py-3 font-medium">Task</th>
              <th className="px-5 py-3 font-medium">Team</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2, 3].map((index) => (
                <tr key={index} className="border-b border-white/[0.04]">
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                  </td>
                </tr>
              ))
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <ClipboardList className="mx-auto size-6 text-tertiary" />
                  <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-white/[0.04] last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/agent-teams/${task.agent_team_id}`}
                      className="font-medium text-foreground transition-colors hover:text-brand"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-tertiary">
                      {task.description}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {teamNames?.get(task.agent_team_id) ?? "Team"}
                  </td>
                  <td className="px-5 py-3.5">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {formatDateTime(task.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
