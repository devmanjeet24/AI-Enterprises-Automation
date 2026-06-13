import type { BrowserTaskStatus } from "@/lib/browser-automation/types";
import { browserTaskStatusLabels } from "@/config/browser-automation";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface BrowserTaskStatusBadgeProps {
  status: BrowserTaskStatus;
}

const statusStyles: Record<BrowserTaskStatus, string> = {
  draft: "border-white/[0.1] bg-white/[0.04] text-muted-foreground",
  ready: cn(dashboardAccents.emerald.border, dashboardAccents.emerald.bgSubtle, dashboardAccents.emerald.text),
  archived: "border-white/[0.08] bg-white/[0.02] text-tertiary",
};

export function BrowserTaskStatusBadge({ status }: BrowserTaskStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        statusStyles[status],
      )}
    >
      {browserTaskStatusLabels[status]}
    </span>
  );
}
