"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getConversation } from "@/lib/api/conversations";
import {
  activateEmployee,
  chatWithEmployee,
  createEmployee,
  deactivateEmployee,
  deleteEmployee,
  getEmployee,
  listEmployeeConversations,
  listEmployees,
  replaceEmployeeKnowledge,
  replaceEmployeeTools,
  updateEmployee,
} from "@/lib/api/employees";
import { listDocuments } from "@/lib/api/documents";
import {
  assignableDocumentKeys,
  conversationKeys,
  employeeKeys,
} from "@/lib/ai-employees/query-keys";
import type {
  AIEmployeeStatus,
  ChatRequest,
  CreateEmployeeInput,
  ToolAssignmentInput,
  UpdateEmployeeInput,
} from "@/lib/ai-employees/types";

import { useAuthToken } from "./use-auth-token";

export function useEmployees(status?: AIEmployeeStatus | "all") {
  const token = useAuthToken();
  const apiStatus = status === "all" || !status ? undefined : status;

  return useQuery({
    queryKey: employeeKeys.list(status),
    queryFn: () => listEmployees(token!, apiStatus),
    enabled: Boolean(token),
  });
}

export function useEmployee(employeeId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => getEmployee(token!, employeeId),
    enabled: Boolean(token) && Boolean(employeeId),
  });
}

export function useAssignableDocuments() {
  const token = useAuthToken();

  return useQuery({
    queryKey: assignableDocumentKeys.all,
    queryFn: async () => {
      const documents = await listDocuments(token!, "ready");
      return documents.filter((doc) => doc.embedded_at != null);
    },
    enabled: Boolean(token),
  });
}

export function useCreateEmployee() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useUpdateEmployee(employeeId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) =>
      updateEmployee(token!, employeeId, input),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), (current) =>
        current ? { ...current, ...employee } : current,
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useActivateEmployee(employeeId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => activateEmployee(token!, employeeId),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), (current) =>
        current ? { ...current, ...employee } : current,
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useDeactivateEmployee(employeeId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deactivateEmployee(token!, employeeId),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), (current) =>
        current ? { ...current, ...employee } : current,
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useDeleteEmployee() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => deleteEmployee(token!, employeeId),
    onSuccess: (_data, employeeId) => {
      queryClient.removeQueries({ queryKey: employeeKeys.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useReplaceEmployeeKnowledge(employeeId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (knowledgeDocumentIds: string[]) =>
      replaceEmployeeKnowledge(token!, employeeId, knowledgeDocumentIds),
    onSuccess: (assignments) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), (current) =>
        current ? { ...current, document_assignments: assignments } : current,
      );
    },
  });
}

export function useReplaceEmployeeTools(employeeId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tools: ToolAssignmentInput[]) =>
      replaceEmployeeTools(token!, employeeId, tools),
    onSuccess: (tools) => {
      queryClient.setQueryData(employeeKeys.detail(employeeId), (current) =>
        current ? { ...current, tools } : current,
      );
    },
  });
}

export function useEmployeeConversations(employeeId: string, enabled = true) {
  const token = useAuthToken();

  return useQuery({
    queryKey: employeeKeys.conversations(employeeId),
    queryFn: () => listEmployeeConversations(token!, employeeId),
    enabled: Boolean(token) && Boolean(employeeId) && enabled,
  });
}

export function useConversation(conversationId: string | null) {
  const token = useAuthToken();

  return useQuery({
    queryKey: conversationKeys.detail(conversationId ?? ""),
    queryFn: () => getConversation(token!, conversationId!),
    enabled: Boolean(token) && Boolean(conversationId),
  });
}

export function useChatWithEmployee(employeeId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChatRequest) =>
      chatWithEmployee(token!, employeeId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.conversations(employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(response.conversation_id),
      });
    },
  });
}
