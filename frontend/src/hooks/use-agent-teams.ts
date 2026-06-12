"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addTeamMember,
  createAgentTeam,
  deleteAgentTeam,
  getAgentTeam,
  listAgentTeams,
  listTeamMembers,
  removeTeamMember,
  submitTeamTask,
  updateAgentTeam,
} from "@/lib/api/agent-teams";
import {
  getAgentTask,
  listAgentTasks,
  runAgentTask,
} from "@/lib/api/agent-tasks";
import { listEmployees } from "@/lib/api/employees";
import { agentTaskKeys, agentTeamKeys } from "@/lib/agent-teams/query-keys";
import type {
  AgentTask,
  AgentTeamDetail,
  AssignableEmployee,
  CreateTaskInput,
  CreateTeamInput,
  TeamMemberDraft,
  UpdateTeamInput,
} from "@/lib/agent-teams/types";

import { useAuthToken } from "./use-auth-token";

const TASK_POLL_MS = 3000;

function hasInProgressTask(tasks: AgentTask[] | undefined): boolean {
  return tasks?.some((task) => task.status === "in_progress") ?? false;
}

export function useAgentTeams() {
  const token = useAuthToken();

  return useQuery({
    queryKey: agentTeamKeys.list(),
    queryFn: () => listAgentTeams(token!),
    enabled: Boolean(token),
  });
}

export function useAgentTeamsOverview() {
  const token = useAuthToken();
  const teamsQuery = useAgentTeams();
  const teamIds = teamsQuery.data?.map((team) => team.id) ?? [];

  const memberQueries = useQueries({
    queries: teamIds.map((teamId) => ({
      queryKey: agentTeamKeys.members(teamId),
      queryFn: () => listTeamMembers(token!, teamId),
      enabled: Boolean(token) && teamsQuery.isSuccess,
    })),
  });

  const tasksQuery = useQuery({
    queryKey: agentTaskKeys.list(),
    queryFn: () => listAgentTasks(token!),
    enabled: Boolean(token) && teamsQuery.isSuccess,
  });

  const details: AgentTeamDetail[] | undefined = teamsQuery.data?.map((team, index) => ({
    ...team,
    members: memberQueries[index]?.data ?? [],
  }));

  const isLoadingMembers = memberQueries.some((query) => query.isLoading);
  const isLoading =
    teamsQuery.isLoading || isLoadingMembers || tasksQuery.isLoading;
  const isError =
    teamsQuery.isError ||
    memberQueries.some((query) => query.isError) ||
    tasksQuery.isError;
  const error =
    teamsQuery.error ?? memberQueries.find((query) => query.error)?.error ?? tasksQuery.error;

  const refetch = async () => {
    await teamsQuery.refetch();
    await Promise.all(memberQueries.map((query) => query.refetch()));
    await tasksQuery.refetch();
  };

  return {
    teams: teamsQuery.data ?? [],
    details,
    tasks: tasksQuery.data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useAgentTeam(teamId: string) {
  const token = useAuthToken();

  const teamQuery = useQuery({
    queryKey: agentTeamKeys.detail(teamId),
    queryFn: () => getAgentTeam(token!, teamId),
    enabled: Boolean(token) && Boolean(teamId),
  });

  const membersQuery = useQuery({
    queryKey: agentTeamKeys.members(teamId),
    queryFn: () => listTeamMembers(token!, teamId),
    enabled: Boolean(token) && Boolean(teamId),
  });

  const data: AgentTeamDetail | undefined =
    teamQuery.data && membersQuery.data
      ? { ...teamQuery.data, members: membersQuery.data }
      : undefined;

  return {
    data,
    isLoading: teamQuery.isLoading || membersQuery.isLoading,
    isError: teamQuery.isError || membersQuery.isError,
    error: teamQuery.error ?? membersQuery.error,
    refetch: async () => {
      await Promise.all([teamQuery.refetch(), membersQuery.refetch()]);
    },
  };
}

export function useAgentTasks(teamId?: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: agentTaskKeys.list(teamId ? { teamId } : undefined),
    queryFn: () =>
      listAgentTasks(token!, teamId ? { agent_team_id: teamId } : undefined),
    enabled: Boolean(token),
    refetchInterval: (query) =>
      hasInProgressTask(query.state.data) ? TASK_POLL_MS : false,
  });
}

export function useAgentTeamTasks(teamId: string) {
  const token = useAuthToken();

  const listQuery = useQuery({
    queryKey: agentTaskKeys.list({ teamId }),
    queryFn: () => listAgentTasks(token!, { agent_team_id: teamId }),
    enabled: Boolean(token) && Boolean(teamId),
  });

  const taskIds = listQuery.data?.map((task) => task.id) ?? [];

  const detailQueries = useQueries({
    queries: taskIds.map((taskId) => ({
      queryKey: agentTaskKeys.detail(taskId),
      queryFn: () => getAgentTask(token!, taskId),
      enabled: Boolean(token) && listQuery.isSuccess,
      refetchInterval: (query: { state: { data?: AgentTask } }) =>
        query.state.data?.status === "in_progress" ? TASK_POLL_MS : false,
    })),
  });

  const tasks: AgentTask[] = detailQueries
    .map((query) => query.data)
    .filter((task): task is AgentTask => task != null);

  const isLoadingDetails = detailQueries.some((query) => query.isLoading);
  const isLoading = listQuery.isLoading || (taskIds.length > 0 && isLoadingDetails);
  const isError =
    listQuery.isError || detailQueries.some((query) => query.isError);
  const error =
    listQuery.error ?? detailQueries.find((query) => query.error)?.error;

  const refetch = async () => {
    await listQuery.refetch();
    await Promise.all(detailQueries.map((query) => query.refetch()));
  };

  return {
    tasks,
    taskSummaries: listQuery.data ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useAgentTask(taskId: string, enabled = true) {
  const token = useAuthToken();

  return useQuery({
    queryKey: agentTaskKeys.detail(taskId),
    queryFn: () => getAgentTask(token!, taskId),
    enabled: Boolean(token) && Boolean(taskId) && enabled,
    refetchInterval: (query) =>
      query.state.data?.status === "in_progress" ? TASK_POLL_MS : false,
  });
}

export function useAssignableEmployees() {
  const token = useAuthToken();

  return useQuery({
    queryKey: [...agentTeamKeys.all, "assignable-employees"] as const,
    queryFn: async (): Promise<AssignableEmployee[]> => {
      const employees = await listEmployees(token!, "active");
      return employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        status: employee.status,
      }));
    },
    enabled: Boolean(token),
  });
}

export function useCreateAgentTeam() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) => createAgentTeam(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.lists() });
    },
  });
}

export function useUpdateAgentTeam(teamId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTeamInput) =>
      updateAgentTeam(token!, teamId, input),
    onSuccess: (team) => {
      queryClient.setQueryData(agentTeamKeys.detail(teamId), team);
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.lists() });
    },
  });
}

export function useDeleteAgentTeam() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => deleteAgentTeam(token!, teamId),
    onSuccess: (_data, teamId) => {
      queryClient.removeQueries({ queryKey: agentTeamKeys.detail(teamId) });
      queryClient.removeQueries({ queryKey: agentTeamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentTaskKeys.lists() });
    },
  });
}

export function useAddTeamMember(teamId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TeamMemberDraft) =>
      addTeamMember(token!, teamId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.lists() });
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      removeTeamMember(token!, teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: agentTeamKeys.lists() });
    },
  });
}

export function useSubmitTeamTask(teamId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      submitTeamTask(token!, teamId, input),
    onSuccess: (task) => {
      queryClient.setQueryData(agentTaskKeys.detail(task.id), task);
      queryClient.invalidateQueries({
        queryKey: agentTaskKeys.list({ teamId }),
      });
      queryClient.invalidateQueries({ queryKey: agentTaskKeys.lists() });
    },
  });
}

export function useRunAgentTask(teamId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => runAgentTask(token!, taskId),
    onSuccess: (task) => {
      queryClient.setQueryData(agentTaskKeys.detail(task.id), task);
      queryClient.invalidateQueries({
        queryKey: agentTaskKeys.list({ teamId }),
      });
      queryClient.invalidateQueries({ queryKey: agentTaskKeys.lists() });
    },
  });
}
