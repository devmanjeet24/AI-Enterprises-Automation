"use client";

import { Mic, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VoiceAgent, VoiceAnalytics } from "@/lib/voice-ai/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface VoiceAiHeroProps {
  agents: VoiceAgent[];
  analytics?: VoiceAnalytics | null;
  analyticsAvailable?: boolean;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function VoiceAiHero({
  agents,
  analytics,
  analyticsAvailable = false,
  canCreate = false,
  onCreateClick,
}: VoiceAiHeroProps) {
  const accent = dashboardAccents.emerald;
  const activeCount =
    analytics?.active_agents ?? agents.filter((agent) => agent.is_active).length;
  const recentCount = analytics?.recent_sessions_7d ?? null;

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] px-6 pb-10 pt-8 md:px-8 md:pb-12 md:pt-10">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent",
          accent.glow,
        )}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <Mic className={cn("size-4", accent.text)} />
            </div>
            <span className={cn("text-[12px] font-medium uppercase tracking-wider", accent.textMuted)}>
              Voice Assistant
            </span>
          </div>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-foreground md:text-[32px]">
            Talk with your AI employees
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Record voice messages in your browser, get instant transcription, and
            continue multi-turn conversations grounded in your knowledge base.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-muted-foreground">
            <span>
              <strong className="text-foreground">{activeCount}</strong> active agents
            </span>
            {analyticsAvailable && recentCount != null && (
              <span>
                <strong className="text-foreground">{recentCount}</strong> sessions this week
              </span>
            )}
          </div>
        </div>
        {canCreate && onCreateClick && (
          <Button variant="brand" size="sm" onClick={onCreateClick}>
            <Plus className="size-3.5" />
            Create assistant
          </Button>
        )}
      </div>
    </section>
  );
}
