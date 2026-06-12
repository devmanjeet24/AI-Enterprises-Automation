import type { AgentTask, AgentTaskStatus } from "@/lib/agent-teams/types";

export type ResearchProjectStatus = "draft" | "active" | "archived";

export type ResearchTemplateType =
  | "market_research"
  | "competitor_analysis"
  | "industry_analysis"
  | "swot_analysis";

export interface ResearchProject {
  id: string;
  organization_id: string;
  agent_team_id: string;
  created_by_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  research_brief: string | null;
  template_type: ResearchTemplateType;
  status: ResearchProjectStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchProjectDetail extends ResearchProject {
  agent_team_name: string;
}

export interface ResearchTemplateStep {
  sequence_order: number;
  name: string;
  description: string;
}

export interface ResearchTemplate {
  template_type: ResearchTemplateType;
  name: string;
  description: string;
  steps: ResearchTemplateStep[];
}

export interface ResearchAnalytics {
  total_projects: number;
  active_projects: number;
  projects_by_status: Record<string, number>;
  projects_by_template: Record<string, number>;
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  reports_by_status: Record<string, number>;
  recent_runs_7d: number;
}

export interface ResearchIntermediateOutput {
  sequence_order?: number;
  ai_employee_id?: string;
  status?: string;
  output?: string | null;
  output_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ResearchExecutionMetadata {
  template_type?: string;
  template_name?: string;
  agent_team_id?: string;
  task_id?: string;
  task_status?: string;
  step_count?: number;
  completed_steps?: number;
  failed_steps?: number;
  duration_seconds?: number;
  started_at?: string;
  completed_at?: string;
  research_brief?: string;
  version_number?: number;
  [key: string]: unknown;
}

export interface ResearchReportSummary {
  id: string;
  organization_id: string;
  research_project_id: string;
  agent_task_id: string | null;
  created_by_id: string | null;
  version_number: number;
  status: AgentTaskStatus;
  final_output: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchReport extends ResearchReportSummary {
  intermediate_outputs: ResearchIntermediateOutput[] | null;
  execution_metadata: ResearchExecutionMetadata | null;
  agent_task: AgentTask | null;
}

export interface ResearchExecutionHistory {
  id: string;
  research_project_id: string;
  version_number: number;
  status: AgentTaskStatus;
  final_output: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateResearchProjectInput {
  name: string;
  slug?: string;
  description?: string;
  research_brief: string;
  template_type: ResearchTemplateType;
  agent_team_id: string;
}

export interface UpdateResearchProjectInput {
  name?: string;
  slug?: string;
  description?: string | null;
  research_brief?: string;
  template_type?: ResearchTemplateType;
  agent_team_id?: string;
  status?: ResearchProjectStatus;
  is_active?: boolean;
}

export interface RunResearchProjectInput {
  title?: string;
  input_payload?: Record<string, unknown> | null;
}

export interface ListResearchReportsParams {
  project_id?: string;
  status?: AgentTaskStatus;
  limit?: number;
}

export type { AgentTask, AgentTaskStatus };
