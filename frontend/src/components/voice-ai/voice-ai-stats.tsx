"use client";

import { CheckCircle2, Clock, Mic, Radio } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { computeVoiceStats } from "@/config/voice-ai";
import type { VoiceAgent, VoiceAnalytics } from "@/lib/voice-ai/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { VoiceAiError } from "./voice-ai-error";
import { VoiceAiStatsSkeleton } from "./voice-ai-skeleton";

interface VoiceAiStatsProps {
  agents: VoiceAgent[];
  analytics?: VoiceAnalytics | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function formatMetricValue(value: number | null): string {
  return value == null ? "—" : String(value);
}

export function VoiceAiStats({
  agents,
  analytics,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: VoiceAiStatsProps) {
  if (isLoading) return <VoiceAiStatsSkeleton />;

  if (isError) {
    return (
      <VoiceAiError
        title="Failed to load voice analytics"
        message={errorMessage ?? "Could not load voice metrics."}
        onRetry={onRetry}
      />
    );
  }

  const computed = computeVoiceStats(agents, analytics);
  const accent = dashboardAccents.emerald;

  const stats = [
    { label: "Total agents", value: formatMetricValue(computed.totalAgents), icon: Mic },
    { label: "Active agents", value: formatMetricValue(computed.activeAgents), icon: Radio },
    { label: "Total sessions", value: formatMetricValue(computed.totalSessions), icon: Clock },
    {
      label: "Completed",
      value: formatMetricValue(computed.completedSessions),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard key={stat.label} variant="panel" accent="emerald" className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border",
                accent.bgSubtle,
                accent.border,
              )}
            >
              <stat.icon className={cn("size-4", accent.text)} />
            </div>
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}
