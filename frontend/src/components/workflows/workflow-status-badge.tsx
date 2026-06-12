import { Badge } from "@/components/ui/badge";
import { workflowStatusLabels } from "@/config/workflows";
import type { WorkflowStatus } from "@/lib/workflows/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<WorkflowStatus, string> = {
  draft: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  active: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  archived: "text-muted-foreground border-white/[0.08] bg-white/[0.03]",
};

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
}

export function WorkflowStatusBadge({ status }: WorkflowStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", statusStyles[status])}
    >
      {workflowStatusLabels[status]}
    </Badge>
  );
}
