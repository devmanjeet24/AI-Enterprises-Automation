"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ACCEPTED_AUDIO_TYPES, formatDateTime } from "@/config/voice-ai";
import {
  useUploadVoiceSessionAudio,
  useVoiceSession,
} from "@/hooks/use-voice-ai";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { getApiErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/api/client";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/voice-ai/access";
import { useToast } from "@/providers/toast-provider";
import { notFound } from "next/navigation";

import { VoiceSessionStatusBadge } from "./voice-ai-badges";
import { VoiceAiAccessDenied } from "./voice-ai-access-denied";
import { VoiceAiError } from "./voice-ai-error";
import { VoiceAiSessionDetailSkeleton } from "./voice-ai-skeleton";
import { VoiceSessionTranscript } from "./voice-session-transcript";

interface VoiceAiSessionDetailPageProps {
  sessionId: string;
}

export function VoiceAiSessionDetailPage({ sessionId }: VoiceAiSessionDetailPageProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const permissions = useUserPermissions();
  const canExecute = hasPermission(permissions, PERMISSIONS.VOICE_SESSIONS_EXECUTE);

  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useVoiceSession(sessionId);

  const uploadMutation = useUploadVoiceSessionAudio(sessionId);

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
          title="Failed to load voice session"
          message={getApiErrorMessage(error, "Could not load session.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!session) {
    notFound();
  }

  const canUpload =
    canExecute &&
    (session.status === "pending" || session.status === "failed") &&
    !uploadMutation.isPending;

  const isProcessing = session.status === "processing" || uploadMutation.isPending;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadMutation.mutateAsync(file);
      toast.success("Audio processed successfully.");
    } catch (uploadError) {
      toast.error(getApiErrorMessage(uploadError, "Failed to process audio."));
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <Link
          href={`/voice-ai/${session.voice_agent_id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to voice agent
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
                {session.title ?? "Voice session"}
              </h1>
              <VoiceSessionStatusBadge status={session.status} />
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {session.voice_agent_id ? (
                <Link
                  href={`/voice-ai/${session.voice_agent_id}`}
                  className="font-medium transition-colors hover:text-brand"
                >
                  {session.voice_agent_name ?? "Voice agent"}
                </Link>
              ) : (
                (session.voice_agent_name ?? "Voice agent")
              )}
              {" · "}
              {session.ai_employee_name ?? "AI employee"}
            </p>
          </div>
          {canUpload && (
            <>
              <Button
                variant="brand"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                Upload audio
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_AUDIO_TYPES}
                className="hidden"
                onChange={(event) => void handleFileChange(event)}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 px-6 pt-8 md:grid-cols-3 md:px-8">
        <DashboardCard variant="panel" accent="emerald" className="p-5 md:col-span-1">
          <h3 className="text-[14px] font-medium text-foreground">Session details</h3>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <VoiceSessionStatusBadge status={session.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="mt-0.5 text-foreground">{formatDateTime(session.started_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Completed</dt>
              <dd className="mt-0.5 text-foreground">{formatDateTime(session.completed_at)}</dd>
            </div>
            {session.audio_mime_type && (
              <div>
                <dt className="text-muted-foreground">Audio type</dt>
                <dd className="mt-0.5 text-foreground">{session.audio_mime_type}</dd>
              </div>
            )}
          </dl>

          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Processing audio…
            </div>
          )}

          {session.status === "failed" && session.error_message && (
            <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-[12px] text-red-300">
              {session.error_message}
            </p>
          )}

          {!canExecute && session.status === "pending" && (
            <p className="mt-4 text-[12px] text-muted-foreground">
              You need execute permission to upload audio.
            </p>
          )}
        </DashboardCard>

        <div className="md:col-span-2">
          <VoiceSessionTranscript
            transcripts={session.transcripts}
            aiEmployeeName={session.ai_employee_name}
            isLoading={isProcessing && session.transcripts.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
