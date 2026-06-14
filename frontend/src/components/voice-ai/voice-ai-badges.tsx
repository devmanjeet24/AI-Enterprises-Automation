import { Badge } from "@/components/ui/badge";
import type { VoiceSessionStatus } from "@/lib/voice-ai/types";
import { formatVoiceSessionStatus } from "@/config/voice-ai";
import { cn } from "@/lib/utils";

const statusStyles: Record<VoiceSessionStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  processing: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  failed: "border-red-400/30 bg-red-400/10 text-red-300",
};

export function VoiceSessionStatusBadge({ status }: { status: VoiceSessionStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", statusStyles[status])}>
      {formatVoiceSessionStatus(status)}
    </Badge>
  );
}

export function VoiceAgentActiveBadge({ isActive }: { isActive: boolean }) {
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
