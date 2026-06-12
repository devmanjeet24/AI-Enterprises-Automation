import { Badge } from "@/components/ui/badge";
import { researchStatusLabels } from "@/config/research-hub";
import type { ResearchProjectStatus } from "@/lib/research-hub/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<ResearchProjectStatus, string> = {
  draft: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  active: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  archived: "text-muted-foreground border-white/[0.08] bg-white/[0.03]",
};

interface ResearchProjectStatusBadgeProps {
  status: ResearchProjectStatus;
}

export function ResearchProjectStatusBadge({ status }: ResearchProjectStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", statusStyles[status])}
    >
      {researchStatusLabels[status]}
    </Badge>
  );
}
