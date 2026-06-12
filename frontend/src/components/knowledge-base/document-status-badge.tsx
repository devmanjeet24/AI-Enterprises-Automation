import { Badge } from "@/components/ui/badge";
import { documentStatusLabels } from "@/config/knowledge-base";
import type { DocumentStatus } from "@/lib/knowledge-base/types";
import { cn } from "@/lib/utils";

const statusVariants: Record<
  DocumentStatus,
  "default" | "warning" | "success" | "destructive"
> = {
  pending: "default",
  processing: "warning",
  ready: "success",
  failed: "destructive",
};

const statusDots: Record<DocumentStatus, string> = {
  pending: "bg-tertiary",
  processing: "bg-warning animate-pulse",
  ready: "bg-success",
  failed: "bg-destructive",
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]} className={cn("gap-2", className)}>
      <span className={cn("size-1.5 rounded-full", statusDots[status])} />
      {documentStatusLabels[status]}
    </Badge>
  );
}
