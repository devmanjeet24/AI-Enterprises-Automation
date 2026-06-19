"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  canUseMicrophoneRecording,
  pickMimeType,
} from "@/lib/voice-ai/recording";

export interface VoiceRecorderState {
  isSupported: boolean;
  isRecording: boolean;
  durationSeconds: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<File | null>;
  cancelRecording: () => void;
}

export function useVoiceRecorder(): VoiceRecorderState {
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsSupported(canUseMicrophoneRecording());
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    cleanupStream();
    setIsRecording(false);
    setDurationSeconds(0);
  }, [cleanupStream]);

  useEffect(() => () => cancelRecording(), [cancelRecording]);

  const startRecording = useCallback(async () => {
    setError(null);
    if (!canUseMicrophoneRecording()) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setDurationSeconds(0);
      timerRef.current = setInterval(() => {
        setDurationSeconds((value) => value + 1);
      }, 1000);
    } catch {
      cleanupStream();
      setError("Microphone access was denied or is unavailable.");
    }
  }, [cleanupStream]);

  const stopRecording = useCallback(async (): Promise<File | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cancelRecording();
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const extension = mimeType.includes("mp4")
          ? ".m4a"
          : mimeType.includes("ogg")
            ? ".ogg"
            : ".webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupStream();
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setIsRecording(false);
        setDurationSeconds(0);

        if (blob.size === 0) {
          setError("Recording was empty. Try speaking closer to the microphone.");
          resolve(null);
          return;
        }

        resolve(
          new File([blob], `voice-message${extension}`, {
            type: mimeType,
            lastModified: Date.now(),
          }),
        );
      };
      recorder.stop();
    });
  }, [cancelRecording, cleanupStream]);

  return {
    isSupported,
    isRecording,
    durationSeconds,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
