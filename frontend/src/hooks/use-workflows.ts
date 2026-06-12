"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAgentTeam, listAgentTeams, listTeamMembers } from "@/lib/api/agent-teams";
import { getAgentTask } from "@/lib/api/agent-tasks";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflowExecutions,
  listWorkflows,
  runWorkflow,
  updateWorkflow,
} from "@/lib/api/workflows";
import { agentTaskKeys } from "@/lib/agent-teams/query-keys";
import { workflowKeys } from "@/lib/workflows/query-keys";
import type {
  AssignableAgentTeam,
  CreateWorkflowInput,
  RunWorkflowInput,
  UpdateWorkflowInput,
  WorkflowDetail,
  WorkflowExecution,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepDraft,
} from "@/lib/workflows/types";

import { useAuthToken } from "./use-auth-token";

const EXECUTION_POLL_MS = 3000;

function hasInProgressExecution(
  executions: WorkflowExecution[] | undefined,
): boolean {
  return executions?.some((execution) => execution.status === "in_progress") ?? false;
}

export function stepsToDraft(steps: WorkflowStep[]): WorkflowStepDraft[] {
  return steps.map((step) => ({
    name: step.name,
    description: step.description,
    sequence_order: step.sequence_order,
    config: step.config,
  }));
}

export function useWorkflows(status?: WorkflowStatus) {
  const token = useAuthToken();

  return useQuery({
    queryKey: workflowKeys.list(status),
    queryFn: () => listWorkflows(token!, status),
    enabled: Boolean(token),
  });
}

export function useAssignableAgentTeams() {
  const token = useAuthToken();

  return useQuery({
    queryKey: workflowKeys.assignableTeams(),
    queryFn: async (): Promise<AssignableAgentTeam[]> => {
      const teams = await listAgentTeams(token!);
      const activeTeams = teams.filter((team) => team.is_active);

      const teamsWithMembers = await Promise.all(
        activeTeams.map(async (team) => {
          const members = await listTeamMembers(token!, team.id);
          return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            is_active: team.is_active,
            member_count: members.length,
          };
        }),
      );

      return teamsWithMembers;
    },
    enabled: Boolean(token),
  });
}

export function useWorkflowsOverview() {
  const token = useAuthToken();
  const workflowsQuery = useWorkflows();
  const workflowIds = workflowsQuery.data?.map((workflow) => workflow.id) ?? [];

  const executionQueries = useQueries({
    queries: workflowIds.map((workflowId) => ({
      queryKey: workflowKeys.executions(workflowId),
      queryFn: () => listWorkflowExecutions(token!, workflowId),
      enabled: Boolean(token) && workflowsQuery.isSuccess,
    })),
  });

  const executions = executionQueries.flatMap((query) => query.data ?? []);

  const isLoadingExecutions = executionQueries.some((query) => query.isLoading);
  const isLoading = workflowsQuery.isLoading || isLoadingExecutions;
  const isError =
    workflowsQuery.isError || executionQueries.some((query) => query.isError);
  const error =
    workflowsQuery.error ??
    executionQueries.find((query) => query.error)?.error;

  const refetch = async () => {
    await workflowsQuery.refetch();
    await Promise.all(executionQueries.map((query) => query.refetch()));
  };

  return {
    workflows: workflowsQuery.data ?? [],
    executions,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useWorkflow(workflowId: string) {
  const token = useAuthToken();

  const workflowQuery = useQuery({
    queryKey: workflowKeys.detail(workflowId),
    queryFn: () => getWorkflow(token!, workflowId),
    enabled: Boolean(token) && Boolean(workflowId),
  });

  const teamId = workflowQuery.data?.agent_team_id;

  const teamQuery = useQuery({
    queryKey: ["agent-teams", "detail", teamId ?? ""],
    queryFn: () => getAgentTeam(token!, teamId!),
    enabled: Boolean(token) && Boolean(teamId),
  });

  const data: WorkflowDetail | undefined = workflowQuery.data
    ? {
        ...workflowQuery.data,
        agent_team_name: teamQuery.data?.name ?? "Loading team…",
      }
    : undefined;

  return {
    data,
    isLoading: workflowQuery.isLoading,
    isError: workflowQuery.isError || teamQuery.isError,
    error: workflowQuery.error ?? teamQuery.error,
    refetch: async () => {
      await Promise.all([workflowQuery.refetch(), teamQuery.refetch()]);
    },
  };
}

export function useWorkflowExecutions(workflowId: string) {
  const token = useAuthToken();

  const listQuery = useQuery({
    queryKey: workflowKeys.executions(workflowId),
    queryFn: () => listWorkflowExecutions(token!, workflowId),
    enabled: Boolean(token) && Boolean(workflowId),
    refetchInterval: (query) =>
      hasInProgressExecution(query.state.data) ? EXECUTION_POLL_MS : false,
  });

  const taskIds =
    listQuery.data
      ?.map((execution) => execution.agent_task_id)
      .filter((id): id is string => id != null) ?? [];

  const taskQueries = useQueries({
    queries: taskIds.map((taskId) => ({
      queryKey: agentTaskKeys.detail(taskId),
      queryFn: () => getAgentTask(token!, taskId),
      enabled: Boolean(token) && listQuery.isSuccess,
      refetchInterval: (query: { state: { data?: { status: string } } }) =>
        query.state.data?.status === "in_progress" ? EXECUTION_POLL_MS : false,
    })),
  });

  const taskById = new Map(
    taskQueries
      .map((query) => query.data)
      .filter((task): task is NonNullable<typeof task> => task != null)
      .map((task) => [task.id, task]),
  );

  const executions: WorkflowExecution[] =
    listQuery.data?.map((execution) => ({
      ...execution,
      agent_task: execution.agent_task_id
        ? taskById.get(execution.agent_task_id)
        : undefined,
    })) ?? [];

  const isLoadingTasks = taskIds.length > 0 && taskQueries.some((q) => q.isLoading);
  const isLoading = listQuery.isLoading || isLoadingTasks;
  const isError =
    listQuery.isError || taskQueries.some((query) => query.isError);
  const error =
    listQuery.error ?? taskQueries.find((query) => query.error)?.error;

  const refetch = async () => {
    await listQuery.refetch();
    await Promise.all(taskQueries.map((query) => query.refetch()));
  };

  return {
    executions,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useCreateWorkflow() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => createWorkflow(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useUpdateWorkflow(workflowId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkflowInput) =>
      updateWorkflow(token!, workflowId, input),
    onSuccess: (workflow) => {
      queryClient.setQueryData(workflowKeys.detail(workflowId), workflow);
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useDeleteWorkflow() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => deleteWorkflow(token!, workflowId),
    onSuccess: (_data, workflowId) => {
      queryClient.removeQueries({ queryKey: workflowKeys.detail(workflowId) });
      queryClient.removeQueries({ queryKey: workflowKeys.executions(workflowId) });
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useRunWorkflow(workflowId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RunWorkflowInput) => runWorkflow(token!, workflowId, input),
    onSuccess: (execution) => {
      if (execution.agent_task) {
        queryClient.setQueryData(
          agentTaskKeys.detail(execution.agent_task.id),
          execution.agent_task,
        );
      }
      queryClient.invalidateQueries({
        queryKey: workflowKeys.executions(workflowId),
      });
    },
  });
}
