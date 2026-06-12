import { Badge } from "@/components/ui/badge";
import { executionStatusLabels } from "@/config/agent-teams";
import type { AgentTaskExecutionStatus } from "@/lib/agent-teams/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<AgentTaskExecutionStatus, string> = {
  pending: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  running: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  completed: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  failed: "text-red-400 border-red-400/20 bg-red-400/10",
  skipped: "text-muted-foreground border-white/[0.08] bg-white/[0.03]",
};

interface ExecutionStatusBadgeProps {
  status: AgentTaskExecutionStatus;
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", statusStyles[status])}
    >
      {executionStatusLabels[status]}
    </Badge>
  );
}
