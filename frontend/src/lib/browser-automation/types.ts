export type BrowserTaskStatus = "draft" | "ready" | "archived";

export type BrowserTaskExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface BrowserProfile {
  id: string;
  organization_id: string;
  created_by_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  user_agent: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  session_persistence_enabled: boolean;
  session_updated_at: string | null;
  session_stored: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrowserTask {
  id: string;
  organization_id: string;
  browser_profile_id: string;
  created_by_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  target_url: string | null;
  instructions: string | null;
  status: BrowserTaskStatus;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BrowserTaskDetail extends BrowserTask {
  profile_name: string;
  profile_is_active: boolean;
}

export interface BrowserTaskExecutionSummary {
  id: string;
  organization_id: string;
  browser_task_id: string;
  browser_profile_id: string;
  status: BrowserTaskExecutionStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  steps_completed?: number | null;
  steps_total?: number | null;
  has_failure_screenshot?: boolean;
}

export interface BrowserExecutionStepTimelineEntry {
  index: number;
  action: string;
  description: string;
  status: "completed" | "failed" | "skipped" | "pending";
  duration_ms: number;
  selector?: string | null;
  error?: string | null;
}

export interface BrowserExecutionFailedStep {
  index: number;
  action: string;
  selector?: string | null;
  message: string;
}

export interface BrowserTaskExecution extends BrowserTaskExecutionSummary {
  created_by_id: string | null;
  result: Record<string, unknown> | null;
  logs: BrowserExecutionLogEntry[] | null;
  execution_metadata: Record<string, unknown> | null;
  updated_at: string;
}

export interface BrowserExecutionLogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
}

export interface BrowserAnalytics {
  total_profiles: number;
  active_profiles: number;
  total_tasks: number;
  ready_tasks: number;
  tasks_by_status: Record<string, number>;
  total_executions: number;
  completed_executions: number;
  failed_executions: number;
  executions_by_status: Record<string, number>;
  recent_executions_7d: number;
}

export interface CreateBrowserProfileInput {
  name: string;
  slug?: string;
  description?: string;
  user_agent?: string;
  viewport_width?: number;
  viewport_height?: number;
  config?: Record<string, unknown>;
  session_persistence_enabled?: boolean;
}

export interface UpdateBrowserProfileInput {
  name?: string;
  slug?: string;
  description?: string | null;
  user_agent?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  config?: Record<string, unknown> | null;
  is_active?: boolean;
  session_persistence_enabled?: boolean;
}

export interface CreateBrowserTaskInput {
  name: string;
  slug?: string;
  description?: string;
  browser_profile_id: string;
  target_url?: string;
  instructions?: string;
  config?: Record<string, unknown>;
}

export interface UpdateBrowserTaskInput {
  name?: string;
  slug?: string;
  description?: string | null;
  browser_profile_id?: string;
  target_url?: string | null;
  instructions?: string | null;
  status?: BrowserTaskStatus;
  config?: Record<string, unknown> | null;
}
