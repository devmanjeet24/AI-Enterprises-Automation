"use client";

import { BookOpen, Bot, Loader2, Volume2, VolumeX } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  formatDateTime,
  formatTranscriptRole,
  hasTranscriptAudio,
  parseTranscriptSources,
} from "@/config/voice-ai";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import type { VoiceTranscript } from "@/lib/voice-ai/types";
import { cn } from "@/lib/utils";

import { VoiceAudioPlayButton } from "./voice-audio-play-button";

interface VoiceSessionChatProps {
  sessionId: string;
  transcripts: VoiceTranscript[];
  aiEmployeeName?: string | null;
  isLoading?: boolean;
  speakingTranscriptId?: string | null;
  onSpeakTranscript?: (transcriptId: string | null) => void;
}

export function VoiceSessionChat({
  sessionId,
  transcripts,
  aiEmployeeName,
  isLoading = false,
  speakingTranscriptId = null,
  onSpeakTranscript,
}: VoiceSessionChatProps) {
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  if (isLoading) {
    return (
      <DashboardCard variant="panel" accent="emerald" className="min-h-[420px] p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  const handleListen = (transcript: VoiceTranscript) => {
    if (speakingTranscriptId === transcript.id && isSpeaking) {
      stop();
      onSpeakTranscript?.(null);
      return;
    }
    onSpeakTranscript?.(transcript.id);
    speak(transcript.content);
  };

  return (
    <DashboardCard variant="panel" accent="emerald" className="flex min-h-[420px] flex-col p-0">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-[14px] font-medium text-foreground">Conversation</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {transcripts.length} message{transcripts.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {transcripts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bot className="size-8 text-tertiary" />
            <p className="mt-4 text-[14px] text-muted-foreground">
              Record a message or upload audio to start the conversation.
            </p>
          </div>
        ) : (
          transcripts.map((entry) => {
            const isAi = entry.role === "ai_assistant";
            const isCaller = entry.role === "caller";
            const authorLabel =
              isAi && aiEmployeeName
                ? aiEmployeeName
                : formatTranscriptRole(entry.role);
            const sources = isAi ? parseTranscriptSources(entry.metadata) : [];
            const canPlayRecording =
              isCaller && hasTranscriptAudio(entry.metadata);

            return (
              <div
                key={entry.id}
                className={cn("flex", isCaller ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-4 py-3",
                    isAi
                      ? "rounded-bl-md border-emerald-400/20 bg-emerald-400/5"
                      : isCaller
                        ? "rounded-br-md border-white/[0.08] bg-white/[0.04]"
                        : "border-white/[0.06] bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {isAi ? (
                      <Bot className="size-3.5 text-emerald-400" />
                    ) : null}
                    <span className="font-medium text-foreground">{authorLabel}</span>
                    <span>·</span>
                    <span>{formatDateTime(entry.created_at)}</span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                    {entry.content}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {canPlayRecording && (
                      <VoiceAudioPlayButton
                        sessionId={sessionId}
                        transcriptId={entry.id}
                        enabled={canPlayRecording}
                      />
                    )}
                    {isAi && ttsSupported && (
                      <button
                        type="button"
                        onClick={() => handleListen(entry)}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {speakingTranscriptId === entry.id && isSpeaking ? (
                          <VolumeX className="size-3" />
                        ) : (
                          <Volume2 className="size-3" />
                        )}
                        {speakingTranscriptId === entry.id && isSpeaking
                          ? "Stop"
                          : "Listen"}
                      </button>
                    )}
                  </div>

                  {sources.length > 0 && (
                    <div className="mt-3 border-t border-white/[0.06] pt-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-tertiary">
                        Knowledge sources
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {sources.map((source, index) => (
                          <li
                            key={`${source.document_title}-${index}`}
                            className="flex items-center gap-2 text-[11px] text-muted-foreground"
                          >
                            <BookOpen className="size-3 shrink-0 text-emerald-400" />
                            <span className="text-foreground">
                              {source.document_title}
                              {source.page_number != null && ` · p. ${source.page_number}`}
                            </span>
                            <span className="text-tertiary">
                              {(source.similarity_score * 100).toFixed(0)}% match
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Generating response…
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
