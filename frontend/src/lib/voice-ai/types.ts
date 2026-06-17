export type VoiceSessionStatus = "pending" | "processing" | "completed" | "failed";

export type VoiceTranscriptRole = "caller" | "ai_assistant" | "system";

export type VoiceInputPhase = "idle" | "recording" | "uploading" | "processing" | "failed";

export interface KnowledgeSourceCitation {
  document_title: string;
  page_number: number | null;
  similarity_score: number;
}

export interface VoiceAgent {
  id: string;
  organization_id: string;
  ai_employee_id: string;
  created_by_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceAgentDetail extends VoiceAgent {
  ai_employee_name: string | null;
  session_count: number;
}

export interface VoiceTranscript {
  id: string;
  voice_session_id: string;
  author_ai_employee_id: string | null;
  role: VoiceTranscriptRole;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceSession {
  id: string;
  organization_id: string;
  voice_agent_id: string;
  created_by_id: string | null;
  title: string | null;
  status: VoiceSessionStatus;
  audio_file_path: string | null;
  audio_mime_type: string | null;
  audio_duration_seconds: number | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceSessionSummary extends VoiceSession {
  voice_agent_name: string | null;
  transcript_count: number;
}

export interface VoiceSessionDetail extends VoiceSession {
  voice_agent_name: string | null;
  ai_employee_name: string | null;
  transcripts: VoiceTranscript[];
}

export interface VoiceAnalytics {
  total_agents: number;
  active_agents: number;
  total_sessions: number;
  completed_sessions: number;
  failed_sessions: number;
  processing_sessions: number;
  pending_sessions: number;
  total_transcripts: number;
  recent_sessions_7d: number;
  sessions_by_status: Record<string, number>;
  transcripts_by_role: Record<string, number>;
  sessions_by_agent: Record<string, number>;
}

export interface CreateVoiceAgentInput {
  name: string;
  slug?: string;
  description?: string;
  ai_employee_id: string;
  config?: Record<string, unknown>;
}

export interface UpdateVoiceAgentInput {
  name?: string;
  slug?: string;
  description?: string | null;
  ai_employee_id?: string;
  config?: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface CreateVoiceSessionInput {
  voice_agent_id: string;
  title?: string;
}

export interface UpdateVoiceSessionInput {
  title?: string | null;
}

export interface ListVoiceSessionsParams {
  voice_agent_id?: string;
}
