import { Badge } from "@/components/ui/badge";
import { teamStatusLabels } from "@/config/agent-teams";
import { cn } from "@/lib/utils";

interface TeamStatusBadgeProps {
  isActive: boolean;
}

export function TeamStatusBadge({ isActive }: TeamStatusBadgeProps) {
  const label = isActive ? teamStatusLabels.active : teamStatusLabels.inactive;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-white/[0.08] bg-white/[0.03] text-[11px] font-medium",
        isActive ? "text-emerald-400" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-emerald-400" : "bg-tertiary",
        )}
      />
      {label}
    </Badge>
  );
}
