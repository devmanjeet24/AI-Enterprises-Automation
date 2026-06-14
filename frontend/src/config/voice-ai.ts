import type { VoiceAgent, VoiceAnalytics } from "@/lib/voice-ai/types";

export function slugifyVoiceAgentName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function getVoiceAgentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString();
}

export function formatVoiceSessionStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatTranscriptRole(role: string): string {
  if (role === "ai_assistant") return "AI Assistant";
  if (role === "caller") return "Caller";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export interface VoiceStats {
  totalAgents: number | null;
  activeAgents: number | null;
  totalSessions: number | null;
  completedSessions: number | null;
}

export function computeVoiceStats(
  agents: VoiceAgent[],
  analytics?: VoiceAnalytics | null,
): VoiceStats {
  if (analytics) {
    return {
      totalAgents: analytics.total_agents,
      activeAgents: analytics.active_agents,
      totalSessions: analytics.total_sessions,
      completedSessions: analytics.completed_sessions,
    };
  }

  return {
    totalAgents: agents.length,
    activeAgents: agents.filter((agent) => agent.is_active).length,
    totalSessions: null,
    completedSessions: null,
  };
}

export const VOICE_SESSION_POLL_MS = 3000;

export const ACCEPTED_AUDIO_TYPES =
  "audio/mpeg,audio/wav,audio/mp4,audio/webm,audio/ogg,.mp3,.wav,.m4a,.webm,.ogg";
