import { Badge } from "@/components/ui/badge";
import { browserExecutionStatusLabels } from "@/config/browser-automation";
import type { BrowserTaskExecutionStatus } from "@/lib/browser-automation/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<BrowserTaskExecutionStatus, string> = {
  pending: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  running: "text-blue-400 border-blue-400/20 bg-blue-400/10",
  completed: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  failed: "text-red-400 border-red-400/20 bg-red-400/10",
  cancelled: "text-muted-foreground border-white/[0.08] bg-white/[0.03]",
};

interface BrowserExecutionStatusBadgeProps {
  status: BrowserTaskExecutionStatus;
}

export function BrowserExecutionStatusBadge({ status }: BrowserExecutionStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", statusStyles[status])}
    >
      {browserExecutionStatusLabels[status]}
    </Badge>
  );
}
