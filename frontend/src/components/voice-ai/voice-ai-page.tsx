"use client";

import { useMemo, useState } from "react";

import { DashboardSectionHeader } from "@/components/dashboard/dashboard-card";
import {
  useVoiceAgents,
  useVoiceAnalytics,
} from "@/hooks/use-voice-ai";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/voice-ai/access";

import { CreateVoiceAgentModal } from "./create-voice-agent-modal";
import { VoiceAiAccessDenied } from "./voice-ai-access-denied";
import { VoiceAiEmptyState } from "./voice-ai-empty-state";
import { VoiceAiError } from "./voice-ai-error";
import { VoiceAiHero } from "./voice-ai-hero";
import { VoiceAgentCardGridSkeleton } from "./voice-ai-skeleton";
import { VoiceAiStats } from "./voice-ai-stats";
import { VoiceAgentCardGrid } from "./voice-ai-card";

export function VoiceAiPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const permissions = useUserPermissions();
  const canCreate = hasPermission(permissions, PERMISSIONS.VOICE_AGENTS_WRITE);

  const {
    data: agents = [],
    isLoading: isLoadingAgents,
    isError: isAgentsError,
    error: agentsError,
    refetch: refetchAgents,
  } = useVoiceAgents();

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useVoiceAnalytics();

  const agentsAccessDenied = isAgentsError && isAccessDeniedError(agentsError);
  const analyticsErrorMessage = isAnalyticsError
    ? getApiErrorMessage(analyticsError, "Failed to load voice analytics.")
    : null;
  const agentsErrorMessage = isAgentsError
    ? getApiErrorMessage(agentsError, "Failed to load voice agents.")
    : null;

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.is_active),
    [agents],
  );

  if (agentsAccessDenied) {
    return (
      <div className="px-6 py-10 md:px-8">
        <VoiceAiAccessDenied />
      </div>
    );
  }

  return (
    <div className="pb-10 md:pb-12">
      <VoiceAiHero
        agents={agents}
        analytics={analytics}
        analyticsAvailable={!isAnalyticsError}
        canCreate={canCreate}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="mt-10 space-y-10 md:mt-12 md:space-y-12">
        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Overview"
            title="Voice metrics"
            description="Track active agents, session volume, and transcription completion."
          />
          <VoiceAiStats
            agents={agents}
            analytics={analytics}
            isLoading={isLoadingAgents || isLoadingAnalytics}
            isError={isAnalyticsError}
            errorMessage={analyticsErrorMessage}
            onRetry={() => void refetchAnalytics()}
          />
        </section>

        <section className="px-6 md:px-8">
          <DashboardSectionHeader
            eyebrow="Studio"
            title="Voice agents"
            description={`${activeAgents.length} active of ${agents.length} total`}
          />
          {isLoadingAgents ? (
            <VoiceAgentCardGridSkeleton />
          ) : isAgentsError ? (
            <VoiceAiError
              title="Failed to load voice agents"
              message={agentsErrorMessage ?? undefined}
              onRetry={() => void refetchAgents()}
            />
          ) : agents.length === 0 ? (
            <VoiceAiEmptyState
              canCreate={canCreate}
              onCreateClick={() => setCreateOpen(true)}
            />
          ) : (
            <VoiceAgentCardGrid agents={agents} />
          )}
        </section>
      </div>

      <CreateVoiceAgentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
