import type {
  AgentTask,
  AgentTaskExecution,
} from "@/lib/agent-teams/types";

export type WorkflowStatus = "draft" | "active" | "archived";

export type WorkflowExecutionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  description: string | null;
  sequence_order: number;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  organization_id: string;
  agent_team_id: string;
  created_by_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: WorkflowStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

export interface WorkflowDetail extends Workflow {
  agent_team_name: string;
}

export interface WorkflowExecution {
  id: string;
  organization_id: string;
  workflow_id: string;
  agent_task_id: string | null;
  created_by_id: string | null;
  status: WorkflowExecutionStatus;
  final_output: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  agent_task?: AgentTask;
}

export interface AssignableAgentTeam {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  member_count: number;
}

export interface WorkflowScheduleDraft {
  enabled: boolean;
  cron_expression: string;
  timezone: string;
}

export interface CreateWorkflowInput {
  name: string;
  slug?: string;
  description?: string;
  agent_team_id: string;
  steps: WorkflowStepDraft[];
}

export interface UpdateWorkflowInput {
  name?: string;
  slug?: string;
  description?: string | null;
  agent_team_id?: string;
  status?: WorkflowStatus;
  is_active?: boolean;
  steps?: WorkflowStepDraft[];
}

export interface WorkflowStepDraft {
  name: string;
  description?: string | null;
  sequence_order: number;
  config?: Record<string, unknown> | null;
}

export interface RunWorkflowInput {
  title?: string;
  description?: string;
  input_payload?: Record<string, unknown> | null;
}

export type { AgentTask, AgentTaskExecution };
