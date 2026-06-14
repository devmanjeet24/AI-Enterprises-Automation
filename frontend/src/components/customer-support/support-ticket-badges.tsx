import type { SupportTicketPriority, SupportTicketStatus } from "@/lib/customer-support/types";
import { supportPriorityLabels, supportStatusLabels } from "@/config/customer-support";
import { cn } from "@/lib/utils";

const statusStyles: Record<SupportTicketStatus, string> = {
  open: "border-[#6B9BF8]/30 bg-[#6B9BF8]/10 text-[#6B9BF8]",
  in_progress: "border-[#A78BFA]/30 bg-[#A78BFA]/10 text-[#A78BFA]",
  waiting: "border-[#f5c518]/30 bg-[#f5c518]/10 text-[#f5c518]",
  resolved: "border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80]",
  closed: "border-white/10 bg-white/[0.06] text-muted-foreground",
};

export function SupportTicketStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        statusStyles[status],
      )}
    >
      {supportStatusLabels[status]}
    </span>
  );
}

const priorityStyles: Record<SupportTicketPriority, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-[#FB923C]",
  urgent: "text-[#F87171]",
};

export function SupportTicketPriorityBadge({
  priority,
}: {
  priority: SupportTicketPriority;
}) {
  return (
    <span className={cn("text-[11px] font-medium", priorityStyles[priority])}>
      {supportPriorityLabels[priority]}
    </span>
  );
}
