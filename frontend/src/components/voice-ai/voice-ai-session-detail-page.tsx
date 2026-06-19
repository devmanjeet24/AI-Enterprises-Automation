"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { formatDateTime } from "@/config/voice-ai";
import {
  useDeleteVoiceSession,
  useUploadVoiceSessionAudio,
  useVoiceSession,
} from "@/hooks/use-voice-ai";
import { useRefreshCurrentUser } from "@/hooks/use-refresh-current-user";
import { useAuthUser, useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import { canDeleteVoiceSessions, canSendVoiceMessages } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/voice-ai/access";
import type { VoiceInputPhase } from "@/lib/voice-ai/types";
import { useToast } from "@/providers/toast-provider";
import { notFound } from "next/navigation";

import { VoiceSessionStatusBadge } from "./voice-ai-badges";
import { VoiceAiAccessDenied } from "./voice-ai-access-denied";
import { VoiceAiError } from "./voice-ai-error";
import { VoiceAiSessionDetailSkeleton } from "./voice-ai-skeleton";
import { VoiceSessionChat } from "./voice-session-chat";
import { VoiceSessionComposer } from "./voice-session-composer";

interface VoiceAiSessionDetailPageProps {
  sessionId: string;
}

export function VoiceAiSessionDetailPage({ sessionId }: VoiceAiSessionDetailPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [inputPhase, setInputPhase] = useState<VoiceInputPhase>("idle");
  const [speakingTranscriptId, setSpeakingTranscriptId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useRefreshCurrentUser();

  const user = useAuthUser();
  const permissions = useUserPermissions();
  const canSendAudio = canSendVoiceMessages(permissions, user?.roles);
  const canDelete = canDeleteVoiceSessions(permissions, user?.roles);

  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useVoiceSession(sessionId);

  const uploadMutation = useUploadVoiceSessionAudio(sessionId);
  const deleteSessionMutation = useDeleteVoiceSession();

  if (isLoading) {
    return <VoiceAiSessionDetailSkeleton />;
  }

  if (isError && isAccessDeniedError(error)) {
    return (
      <div className="px-6 py-10 md:px-8">
        <VoiceAiAccessDenied message="You do not have permission to view this voice session." />
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
          title="Failed to load conversation"
          message={getApiErrorMessage(error, "Could not load session.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!session) {
    notFound();
  }

  const isServerProcessing =
    session.status === "processing" || uploadMutation.isPending;
  const canSend =
    canSendAudio &&
    !isServerProcessing &&
    session.status !== "processing";
  const isAwaitingFirstMessage =
    session.status === "pending" && session.transcripts.length === 0;

  const handleSendFile = async (file: File) => {
    setInputPhase("uploading");
    try {
      setInputPhase("processing");
      await uploadMutation.mutateAsync(file);
      setInputPhase("idle");
      toast.success("Message processed.");
    } catch (uploadError) {
      setInputPhase("failed");
      toast.error(getApiErrorMessage(uploadError, "Failed to process audio."));
    }
  };

  const displayPhase: VoiceInputPhase = uploadMutation.isPending
    ? inputPhase === "idle"
      ? "processing"
      : inputPhase
    : session.status === "failed"
      ? "failed"
      : "idle";

  const handleDeleteSession = async () => {
    const label = session.title ?? "this conversation";
    if (
      !window.confirm(
        `Delete "${label}" permanently? This removes all transcripts and audio.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      toast.success("Conversation deleted.");
      router.push(`/voice-ai/${session.voice_agent_id}`);
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete conversation."));
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col pb-0">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <Link
          href={`/voice-ai/${session.voice_agent_id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to voice assistant
        </Link>
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
                {session.title ?? "Voice conversation"}
              </h1>
              <VoiceSessionStatusBadge status={session.status} />
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {session.voice_agent_id ? (
                <Link
                  href={`/voice-ai/${session.voice_agent_id}`}
                  className="font-medium transition-colors hover:text-brand"
                >
                  {session.voice_agent_name ?? "Voice assistant"}
                </Link>
              ) : (
                (session.voice_agent_name ?? "Voice assistant")
              )}
              {" · "}
              {session.ai_employee_name ?? "AI employee"}
            </p>
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-red-300 hover:text-red-200"
              disabled={isServerProcessing || isDeleting}
              onClick={() => void handleDeleteSession()}
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete conversation
            </Button>
          )}
        </div>
      </div>

      <div className="grid flex-1 gap-6 px-6 pt-6 md:grid-cols-[240px_1fr] md:px-8">
        <DashboardCard variant="panel" accent="emerald" className="hidden h-fit p-5 md:block">
          <h3 className="text-[14px] font-medium text-foreground">Session</h3>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <VoiceSessionStatusBadge status={session.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Messages</dt>
              <dd className="mt-0.5 text-foreground">{session.transcripts.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="mt-0.5 text-foreground">{formatDateTime(session.started_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last activity</dt>
              <dd className="mt-0.5 text-foreground">{formatDateTime(session.completed_at)}</dd>
            </div>
          </dl>

          {session.status === "failed" && session.error_message && (
            <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-[12px] text-red-300">
              {session.error_message}
            </p>
          )}

          {isAwaitingFirstMessage && (
            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
              Pending means this conversation is ready for your first voice message.
              Record or upload audio below to begin.
            </p>
          )}

          {!canSendAudio && (
            <p className="mt-4 text-[12px] text-muted-foreground">
              You need voice session write or execute permission to send messages.
            </p>
          )}
        </DashboardCard>

        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-white/[0.06]">
          <VoiceSessionChat
            sessionId={sessionId}
            transcripts={session.transcripts}
            aiEmployeeName={session.ai_employee_name}
            isLoading={isServerProcessing}
            speakingTranscriptId={speakingTranscriptId}
            onSpeakTranscript={setSpeakingTranscriptId}
          />
          <VoiceSessionComposer
            phase={displayPhase}
            canSend={canSend}
            onSendFile={handleSendFile}
          />
        </div>
      </div>
    </div>
  );
}
