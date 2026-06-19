"use client";

import { Loader2, Mic, Square, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { ACCEPTED_AUDIO_TYPES, VOICE_INPUT_PHASE_LABELS } from "@/config/voice-ai";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import {
  canUseMicrophoneRecording,
  isMicrophoneBlockedByInsecureHttp,
} from "@/lib/voice-ai/recording";
import type { VoiceInputPhase } from "@/lib/voice-ai/types";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface VoiceSessionComposerProps {
  phase: VoiceInputPhase;
  canSend: boolean;
  onSendFile: (file: File) => Promise<void>;
}

export function VoiceSessionComposer({
  phase,
  canSend,
  onSendFile,
}: VoiceSessionComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();
  const isBusy = phase === "uploading" || phase === "processing";
  const canRecord = canSend && canUseMicrophoneRecording();
  const micBlockedByHttp = canSend && isMicrophoneBlockedByInsecureHttp();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await onSendFile(file);
    } finally {
      event.target.value = "";
    }
  };

  const handleMicClick = async () => {
    if (recorder.isRecording) {
      const file = await recorder.stopRecording();
      if (file) await onSendFile(file);
      return;
    }
    await recorder.startRecording();
  };

  const steps: VoiceInputPhase[] = ["recording", "uploading", "processing"];
  const activeStepIndex =
    phase === "recording"
      ? 0
      : phase === "uploading"
        ? 1
        : phase === "processing"
          ? 2
          : -1;

  return (
    <div className="border-t border-white/[0.06] bg-background/80 px-5 py-4 backdrop-blur-sm">
      {(recorder.isRecording || isBusy) && (
        <div className="mb-4 flex items-center justify-center gap-3">
          {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isDone = activeStepIndex > index;
            return (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[10px] font-medium",
                    isDone
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : isActive
                        ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-200"
                        : "border-white/[0.08] text-tertiary",
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </div>
                <span
                  className={cn(
                    "text-[11px]",
                    isActive || isDone ? "text-foreground" : "text-tertiary",
                  )}
                >
                  {VOICE_INPUT_PHASE_LABELS[step]}
                </span>
                {index < steps.length - 1 && (
                  <span className="mx-1 h-px w-6 bg-white/[0.08]" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {recorder.isRecording && (
        <div className="mb-3 flex items-center justify-center gap-2 text-[13px] text-red-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-red-400" />
          </span>
          Recording {formatDuration(recorder.durationSeconds)}
        </div>
      )}

      {recorder.error && (
        <p className="mb-3 text-center text-[12px] text-red-300">{recorder.error}</p>
      )}

      {micBlockedByHttp && (
        <p className="mb-3 text-center text-[12px] text-amber-300">
          Microphone recording requires HTTPS on this server. Use Upload audio instead, or open
          the app over a secure connection.
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant={recorder.isRecording ? "destructive" : "brand"}
          size="sm"
          disabled={isBusy || (!recorder.isRecording && !canRecord)}
          onClick={() => void handleMicClick()}
          title={
            !canSend
              ? "You do not have permission to send voice messages"
              : micBlockedByHttp
                ? "Microphone requires HTTPS (upload audio instead)"
                : recorder.isSupported
                  ? recorder.isRecording
                    ? "Stop and send"
                    : "Record message"
                  : "Microphone not supported in this browser"
          }
        >
          {recorder.isRecording ? (
            <Square className="size-3.5" />
          ) : isBusy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Mic className="size-3.5" />
          )}
          {recorder.isRecording ? "Stop & send" : "Record"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canSend || isBusy || recorder.isRecording}
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
      </div>

      {!canSend && (
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          You need voice session write or execute permission to send messages.
        </p>
      )}
    </div>
  );
}
