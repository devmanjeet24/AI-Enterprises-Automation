"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/voice-ai";
import {
  useCreateVoiceSession,
  useDeleteVoiceSession,
  useVoiceAgent,
  useVoiceSessions,
} from "@/hooks/use-voice-ai";
import { useAuthUser, useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import {
  PERMISSIONS,
  canDeleteVoiceSessions,
  canSendVoiceMessages,
  hasPermission,
} from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/voice-ai/access";
import { useToast } from "@/providers/toast-provider";
import { notFound } from "next/navigation";

import { VoiceAgentActiveBadge, VoiceSessionStatusBadge } from "./voice-ai-badges";
import { VoiceAiAccessDenied } from "./voice-ai-access-denied";
import { VoiceAiDetailSkeleton } from "./voice-ai-skeleton";
import { VoiceAiError } from "./voice-ai-error";

interface VoiceAiDetailPageProps {
  agentId: string;
}

export function VoiceAiDetailPage({ agentId }: VoiceAiDetailPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const user = useAuthUser();
  const permissions = useUserPermissions();
  const canExecute = canSendVoiceMessages(permissions, user?.roles);
  const canWrite = hasPermission(permissions, PERMISSIONS.VOICE_SESSIONS_WRITE);
  const canDelete = canDeleteVoiceSessions(permissions, user?.roles);

  const {
    data: agent,
    isLoading,
    isError,
    error,
    refetch,
  } = useVoiceAgent(agentId);

  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
  } = useVoiceSessions({ voice_agent_id: agentId });

  const createSessionMutation = useCreateVoiceSession();
  const deleteSessionMutation = useDeleteVoiceSession();

  if (isLoading) {
    return <VoiceAiDetailSkeleton />;
  }

  if (isError && isAccessDeniedError(error)) {
    return (
      <div className="px-6 py-10 md:px-8">
        <VoiceAiAccessDenied message="You do not have permission to view this voice agent." />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <div className="px-6 py-10 md:px-8">
        <VoiceAiError
          title="Failed to load voice agent"
          message={getApiErrorMessage(error, "Could not load voice agent.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!agent) {
    notFound();
  }

  const handleStartSession = async () => {
    if (!canWrite) return;
    setIsCreatingSession(true);
    try {
      const session = await createSessionMutation.mutateAsync({
        voice_agent_id: agent.id,
        title: `Conversation ${new Date().toLocaleString()}`,
      });
      toast.success("Conversation started.");
      router.push(`/voice-ai/sessions/${session.id}`);
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, "Failed to create session."));
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async (
    sessionId: string,
    title: string | null | undefined,
  ) => {
    const label = title ?? "this conversation";
    if (
      !window.confirm(
        `Delete "${label}" permanently? This removes all transcripts and audio.`,
      )
    ) {
      return;
    }

    setDeletingSessionId(sessionId);
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      toast.success("Conversation deleted.");
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete conversation."));
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <Link
          href="/voice-ai"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to voice assistants
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
                {agent.name}
              </h1>
              <VoiceAgentActiveBadge isActive={agent.is_active} />
            </div>
            <p className="mt-1 font-mono text-[12px] text-tertiary">{agent.slug}</p>
            {agent.description && (
              <p className="mt-3 max-w-2xl text-[14px] text-muted-foreground">
                {agent.description}
              </p>
            )}
          </div>
          {canWrite && (
            <Button
              variant="brand"
              size="sm"
              onClick={() => void handleStartSession()}
              disabled={isCreatingSession || !agent.is_active}
            >
              {isCreatingSession ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <MessageSquarePlus className="size-3.5" />
              )}
              Start conversation
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 px-6 pt-8 md:grid-cols-3 md:px-8">
        <DashboardCard variant="panel" accent="emerald" className="p-5 md:col-span-1">
          <h3 className="text-[14px] font-medium text-foreground">Configuration</h3>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div>
              <dt className="text-muted-foreground">AI employee</dt>
              <dd className="mt-0.5 text-foreground">
                {agent.ai_employee_id ? (
                  <Link
                    href={`/ai-employees/${agent.ai_employee_id}`}
                    className="font-medium transition-colors hover:text-brand"
                  >
                    {agent.ai_employee_name ?? "View employee"}
                  </Link>
                ) : (
                  (agent.ai_employee_name ?? "—")
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sessions</dt>
              <dd className="mt-0.5 text-foreground">{agent.session_count}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-foreground">{formatDateTime(agent.created_at)}</dd>
            </div>
          </dl>
          {!canExecute && (
            <p className="mt-4 text-[12px] text-muted-foreground">
              You need execute permission to record or send voice messages.
            </p>
          )}
        </DashboardCard>

        <div className="md:col-span-2">
          <h3 className="mb-4 text-[14px] font-medium text-foreground">Conversations</h3>
          {isLoadingSessions ? (
            <DashboardCard variant="panel" className="flex items-center justify-center gap-2 p-8">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">Loading sessions…</span>
            </DashboardCard>
          ) : sessions.length === 0 ? (
            <DashboardCard variant="panel" accent="emerald" className="flex flex-col items-center p-10 text-center">
              <MessageSquarePlus className="size-8 text-tertiary" />
              <h4 className="mt-4 text-[15px] font-medium text-foreground">No conversations yet</h4>
              <p className="mt-2 max-w-sm text-[13px] text-muted-foreground">
                Start a conversation and record or upload voice messages to talk with
                your AI employee.
              </p>
            </DashboardCard>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <DashboardCard
                  key={session.id}
                  variant="default"
                  accent="emerald"
                  className="p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/voice-ai/sessions/${session.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-[14px] font-medium text-foreground">
                        {session.title ?? "Untitled session"}
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {session.transcript_count} transcript
                        {session.transcript_count === 1 ? "" : "s"} ·{" "}
                        {formatDateTime(session.created_at)}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <VoiceSessionStatusBadge status={session.status} />
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-red-300"
                          disabled={
                            session.status === "processing" ||
                            deletingSessionId === session.id
                          }
                          title={
                            session.status === "processing"
                              ? "Cannot delete while processing"
                              : "Delete conversation"
                          }
                          onClick={() =>
                            void handleDeleteSession(session.id, session.title)
                          }
                        >
                          {deletingSessionId === session.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </DashboardCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
