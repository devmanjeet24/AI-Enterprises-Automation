export type AgentTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentTaskExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export interface AgentTeam {
  id: string;
  organization_id: string;
  created_by_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentTeamMember {
  id: string;
  agent_team_id: string;
  ai_employee_id: string;
  collaboration_role: string;
  sequence_order: number;
  added_at: string;
  employee_name: string;
  employee_role: string;
  employee_status: "active" | "inactive";
}

export interface AgentTeamDetail extends AgentTeam {
  members: AgentTeamMember[];
}

export interface AgentTaskExecution {
  id: string;
  agent_task_id: string;
  ai_employee_id: string;
  agent_team_member_id: string | null;
  sequence_order: number;
  status: AgentTaskExecutionStatus;
  input_summary: string | null;
  output: string | null;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  employee_name: string | null;
  collaboration_role: string | null;
}

export interface AgentTask {
  id: string;
  organization_id: string;
  agent_team_id: string;
  created_by_id: string | null;
  title: string;
  description: string;
  status: AgentTaskStatus;
  input_payload: Record<string, unknown> | null;
  result: string | null;
  created_at: string;
  updated_at: string;
  executions?: AgentTaskExecution[];
}

export interface CreateTeamInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateTeamInput {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface AssignableEmployee {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive";
}

export interface TeamMemberDraft {
  ai_employee_id: string;
  collaboration_role: string;
  sequence_order: number;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  input_payload?: Record<string, unknown> | null;
}
