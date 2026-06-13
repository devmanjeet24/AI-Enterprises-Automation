import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DepartmentStatusBadgeProps {
  isActive: boolean;
}

export function DepartmentStatusBadge({ isActive }: DepartmentStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium",
        isActive
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
