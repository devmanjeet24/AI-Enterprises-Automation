import { Badge } from "@/components/ui/badge";
import { taskStatusLabels } from "@/config/agent-teams";
import type { AgentTaskStatus } from "@/lib/agent-teams/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<AgentTaskStatus, string> = {
  pending: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  in_progress: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  completed: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  failed: "text-red-400 border-red-400/20 bg-red-400/10",
  cancelled: "text-muted-foreground border-white/[0.08] bg-white/[0.03]",
};

interface TaskStatusBadgeProps {
  status: AgentTaskStatus;
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        statusStyles[status],
      )}
    >
      {taskStatusLabels[status]}
    </Badge>
  );
}
