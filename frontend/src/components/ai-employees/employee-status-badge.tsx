import { Badge } from "@/components/ui/badge";
import { employeeStatusLabels } from "@/config/ai-employees";
import type { AIEmployeeStatus } from "@/lib/ai-employees/types";
import { cn } from "@/lib/utils";

const statusVariants: Record<AIEmployeeStatus, "success" | "outline"> = {
  active: "success",
  inactive: "outline",
};

const statusDots: Record<AIEmployeeStatus, string> = {
  active: "bg-success",
  inactive: "bg-tertiary",
};

interface EmployeeStatusBadgeProps {
  status: AIEmployeeStatus;
  className?: string;
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]} className={cn("gap-2", className)}>
      <span className={cn("size-1.5 rounded-full", statusDots[status])} />
      {employeeStatusLabels[status]}
    </Badge>
  );
}
