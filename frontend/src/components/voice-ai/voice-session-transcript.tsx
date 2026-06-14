"use client";

import { Bot, Loader2, Mic, User } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime, formatTranscriptRole } from "@/config/voice-ai";
import type { VoiceTranscript } from "@/lib/voice-ai/types";
import { cn } from "@/lib/utils";

interface VoiceSessionTranscriptProps {
  transcripts: VoiceTranscript[];
  aiEmployeeName?: string | null;
  isLoading?: boolean;
}

export function VoiceSessionTranscript({
  transcripts,
  aiEmployeeName,
  isLoading = false,
}: VoiceSessionTranscriptProps) {
  if (isLoading) {
    return (
      <DashboardCard variant="panel" accent="emerald" className="min-h-[320px] p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard variant="panel" accent="emerald" className="flex flex-col p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-[14px] font-medium text-foreground">Transcript</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {transcripts.length} entr{transcripts.length === 1 ? "y" : "ies"}
        </p>
      </div>

      <div className="max-h-[520px] flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Mic className="size-8 text-tertiary" />
            <p className="mt-4 text-[14px] text-muted-foreground">
              Upload audio to generate a transcript and AI response.
            </p>
          </div>
        ) : (
          transcripts.map((entry) => {
            const isAi = entry.role === "ai_assistant";
            const isSystem = entry.role === "system";
            const authorLabel =
              isAi && aiEmployeeName
                ? aiEmployeeName
                : formatTranscriptRole(entry.role);

            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  isAi
                    ? "border-emerald-400/20 bg-emerald-400/5"
                    : isSystem
                      ? "border-white/[0.06] bg-white/[0.02]"
                      : "border-white/[0.08] bg-white/[0.03]",
                )}
              >
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  {isAi ? (
                    <Bot className="size-3.5 text-emerald-400" />
                  ) : (
                    <User className="size-3.5" />
                  )}
                  <span className="font-medium text-foreground">{authorLabel}</span>
                  <span>·</span>
                  <span>{formatDateTime(entry.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {entry.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
