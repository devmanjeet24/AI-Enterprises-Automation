"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createBrowserProfile,
  deleteBrowserProfile,
  getBrowserProfile,
  listBrowserProfiles,
  updateBrowserProfile,
} from "@/lib/api/browser-profiles";
import {
  createBrowserTask,
  deleteBrowserTask,
  getBrowserAnalytics,
  getBrowserExecution,
  getBrowserTask,
  listBrowserTaskExecutions,
  listBrowserTasks,
  listOrgBrowserExecutions,
  runBrowserTask,
  updateBrowserTask,
} from "@/lib/api/browser-tasks";
import { browserAutomationKeys } from "@/lib/browser-automation/query-keys";
import type {
  BrowserTaskDetail,
  BrowserTaskExecutionStatus,
  BrowserTaskExecutionSummary,
  CreateBrowserProfileInput,
  CreateBrowserTaskInput,
  UpdateBrowserProfileInput,
  UpdateBrowserTaskInput,
} from "@/lib/browser-automation/types";

import { useAuthToken } from "./use-auth-token";

const EXECUTION_POLL_MS = 3000;

function hasInProgressExecution(
  executions: BrowserTaskExecutionSummary[] | undefined,
): boolean {
  return (
    executions?.some(
      (execution) => execution.status === "pending" || execution.status === "running",
    ) ?? false
  );
}

export function useBrowserAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.analytics(),
    queryFn: () => getBrowserAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserProfiles() {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.profileList(),
    queryFn: () => listBrowserProfiles(token!),
    enabled: Boolean(token),
  });
}

export function useBrowserProfile(profileId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.profileDetail(profileId),
    queryFn: () => getBrowserProfile(token!, profileId),
    enabled: Boolean(token) && Boolean(profileId),
  });
}

export function useBrowserTasks(browserProfileId?: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.taskList(browserProfileId),
    queryFn: () => listBrowserTasks(token!, browserProfileId),
    enabled: Boolean(token),
  });
}

export function useBrowserTask(taskId: string) {
  const token = useAuthToken();

  const taskQuery = useQuery({
    queryKey: browserAutomationKeys.taskDetail(taskId),
    queryFn: () => getBrowserTask(token!, taskId),
    enabled: Boolean(token) && Boolean(taskId),
  });

  const profileId = taskQuery.data?.browser_profile_id;

  const profileQuery = useQuery({
    queryKey: browserAutomationKeys.profileDetail(profileId ?? ""),
    queryFn: () => getBrowserProfile(token!, profileId!),
    enabled: Boolean(token) && Boolean(profileId),
  });

  const data: BrowserTaskDetail | undefined = taskQuery.data
    ? {
        ...taskQuery.data,
        profile_name: profileQuery.data?.name ?? "Loading profile…",
        profile_is_active: profileQuery.data?.is_active ?? false,
      }
    : undefined;

  return {
    data,
    isLoading: taskQuery.isLoading,
    isError: taskQuery.isError || profileQuery.isError,
    error: taskQuery.error ?? profileQuery.error,
    refetch: async () => {
      await Promise.all([taskQuery.refetch(), profileQuery.refetch()]);
    },
  };
}

export function useBrowserTaskExecutions(taskId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.taskExecutions(taskId),
    queryFn: () => listBrowserTaskExecutions(token!, taskId),
    enabled: Boolean(token) && Boolean(taskId),
    refetchInterval: (query) =>
      hasInProgressExecution(query.state.data) ? EXECUTION_POLL_MS : false,
  });
}

export function useOrgBrowserExecutions(browserTaskId?: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.orgExecutions(browserTaskId),
    queryFn: () => listOrgBrowserExecutions(token!, browserTaskId),
    enabled: Boolean(token),
    refetchInterval: (query) =>
      hasInProgressExecution(query.state.data) ? EXECUTION_POLL_MS : false,
  });
}

export function useBrowserExecution(executionId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: browserAutomationKeys.executionDetail(executionId),
    queryFn: () => getBrowserExecution(token!, executionId),
    enabled: Boolean(token) && Boolean(executionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? EXECUTION_POLL_MS : false;
    },
  });
}

export function useCreateBrowserProfile() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBrowserProfileInput) =>
      createBrowserProfile(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.profileLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
    },
  });
}

export function useUpdateBrowserProfile(profileId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBrowserProfileInput) =>
      updateBrowserProfile(token!, profileId, input),
    onSuccess: (profile) => {
      queryClient.setQueryData(browserAutomationKeys.profileDetail(profileId), profile);
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.profileLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.taskLists() });
    },
  });
}

export function useDeleteBrowserProfile() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => deleteBrowserProfile(token!, profileId),
    onSuccess: (_data, profileId) => {
      queryClient.removeQueries({
        queryKey: browserAutomationKeys.profileDetail(profileId),
      });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.profileLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.taskLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
    },
  });
}

export function useCreateBrowserTask() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBrowserTaskInput) => createBrowserTask(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.taskLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
    },
  });
}

export function useUpdateBrowserTask(taskId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBrowserTaskInput) =>
      updateBrowserTask(token!, taskId, input),
    onSuccess: (task) => {
      queryClient.setQueryData(browserAutomationKeys.taskDetail(taskId), task);
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.taskLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
    },
  });
}

export function useDeleteBrowserTask() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteBrowserTask(token!, taskId),
    onSuccess: (_data, taskId) => {
      queryClient.removeQueries({ queryKey: browserAutomationKeys.taskDetail(taskId) });
      queryClient.removeQueries({
        queryKey: browserAutomationKeys.taskExecutions(taskId),
      });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.taskLists() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.executions() });
    },
  });
}

export function useRunBrowserTask(taskId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runBrowserTask(token!, taskId),
    onSuccess: (execution) => {
      queryClient.invalidateQueries({
        queryKey: browserAutomationKeys.taskExecutions(taskId),
      });
      queryClient.setQueryData(
        browserAutomationKeys.executionDetail(execution.id),
        execution,
      );
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.executions() });
      queryClient.invalidateQueries({ queryKey: browserAutomationKeys.analytics() });
    },
  });
}

export type { BrowserTaskExecutionStatus };
