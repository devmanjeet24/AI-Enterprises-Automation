"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useVoiceTranscriptAudio } from "@/hooks/use-voice-transcript-audio";

interface VoiceAudioPlayButtonProps {
  sessionId: string;
  transcriptId: string;
  enabled: boolean;
  label?: string;
}

export function VoiceAudioPlayButton({
  sessionId,
  transcriptId,
  enabled,
  label = "Play recording",
}: VoiceAudioPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { data: audioUrl, isLoading, isError } = useVoiceTranscriptAudio(
    sessionId,
    transcriptId,
    enabled,
  );

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [audioUrl]);

  if (!enabled || isError) return null;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
    }
    await audio.play();
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-7 gap-1.5 px-2 text-[11px]"
        onClick={() => void togglePlayback()}
        disabled={isLoading || !audioUrl}
      >
        {isLoading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : isPlaying ? (
          <Pause className="size-3" />
        ) : (
          <Play className="size-3" />
        )}
        {label}
      </Button>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} className="hidden" preload="none" />
    </>
  );
}
