import { Badge } from "@/components/ui/badge";
import { channelTypeLabels, conversationStatusLabels, handoffStatusLabels } from "@/config/omnichannel";
import type {
  OmnichannelChannelType,
  OmnichannelConversationStatus,
  OmnichannelHandoffStatus,
} from "@/lib/omnichannel/types";
import { cn } from "@/lib/utils";

export function OmnichannelChannelTypeBadge({ type }: { type: OmnichannelChannelType | string }) {
  return (
    <Badge variant="outline" className="border-purple-400/30 bg-purple-400/10 text-[11px] text-purple-300">
      {channelTypeLabels[type] ?? type}
    </Badge>
  );
}

export function OmnichannelStatusBadge({ status }: { status: OmnichannelConversationStatus }) {
  const styles: Record<OmnichannelConversationStatus, string> = {
    open: "border-blue-400/30 bg-blue-400/10 text-blue-300",
    ai_handling: "border-purple-400/30 bg-purple-400/10 text-purple-300",
    waiting_human: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    resolved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    closed: "border-white/10 bg-white/[0.04] text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", styles[status])}>
      {conversationStatusLabels[status]}
    </Badge>
  );
}

export function OmnichannelHandoffBadge({ status }: { status: OmnichannelHandoffStatus }) {
  const styles: Record<OmnichannelHandoffStatus, string> = {
    none: "border-white/10 bg-white/[0.04] text-muted-foreground",
    requested: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    assigned: "border-blue-400/30 bg-blue-400/10 text-blue-300",
    completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", styles[status])}>
      {handoffStatusLabels[status]}
    </Badge>
  );
}

export function OmnichannelActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-medium",
        isActive
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-muted-foreground",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
