"use client";

import { ArrowRight, Mic, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatRelativeDate, getVoiceAgentInitials } from "@/config/voice-ai";
import type { VoiceAgent } from "@/lib/voice-ai/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

import { VoiceAgentActiveBadge } from "./voice-ai-badges";

interface VoiceAgentCardProps {
  agent: VoiceAgent;
}

export function VoiceAgentCard({ agent }: VoiceAgentCardProps) {
  const accent = dashboardAccents.emerald;
  const router = useRouter();

  return (
    <Link href={`/voice-ai/${agent.id}`} className="block">
      <DashboardCard variant="default" accent="emerald" className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl border text-[12px] font-semibold",
                accent.bgSubtle,
                accent.border,
                accent.text,
              )}
            >
              {getVoiceAgentInitials(agent.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-foreground group-hover/card:text-brand">
                {agent.name}
              </h3>
              <p className="mt-0.5 truncate font-mono text-[12px] text-tertiary">
                {agent.slug}
              </p>
            </div>
          </div>
          <VoiceAgentActiveBadge isActive={agent.is_active} />
        </div>

        {agent.description && (
          <p className="mt-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {agent.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-brand"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              router.push(`/ai-employees/${agent.ai_employee_id}`);
            }}
          >
            <User className="size-3.5" />
            View linked AI employee
          </button>
          <span className={cn("flex items-center gap-1 text-[12px] font-medium", accent.text)}>
            <Mic className="size-3" />
            Open
            <ArrowRight className="size-3" />
          </span>
        </div>
        <p className="mt-2 text-[11px] text-tertiary">
          Updated {formatRelativeDate(agent.updated_at)}
        </p>
      </DashboardCard>
    </Link>
  );
}

interface VoiceAgentCardGridProps {
  agents: VoiceAgent[];
}

export function VoiceAgentCardGrid({ agents }: VoiceAgentCardGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {agents.map((agent) => (
        <VoiceAgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
