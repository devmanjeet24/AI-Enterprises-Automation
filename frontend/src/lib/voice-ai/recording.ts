/** Microphone / MediaRecorder availability for Voice Assistant. */

export function isLocalDevelopmentHost(hostname?: string): boolean {
  const host =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "");
  if (!host) return false;

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost")
  );
}

export function detectRecorderSupport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

/**
 * Browsers allow microphone access on secure contexts (HTTPS) and on local dev hosts.
 * http://localhost and http://127.0.0.1 are treated as safe for recording.
 */
export function canUseMicrophoneRecording(): boolean {
  if (!detectRecorderSupport()) return false;
  if (typeof window === "undefined") return false;

  return window.isSecureContext || isLocalDevelopmentHost();
}

/** True on plain HTTP public deployments where the mic API is blocked. */
export function isMicrophoneBlockedByInsecureHttp(): boolean {
  if (typeof window === "undefined") return false;
  if (!detectRecorderSupport()) return false;
  if (window.isSecureContext) return false;
  if (isLocalDevelopmentHost()) return false;
  return true;
}

export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}
