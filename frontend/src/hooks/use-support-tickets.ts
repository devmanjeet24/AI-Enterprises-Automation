"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSupportCategory,
  deleteSupportCategory,
  listSupportCategories,
  updateSupportCategory,
} from "@/lib/api/support-categories";
import {
  createSupportTicket,
  createTicketMessage,
  deleteSupportTicket,
  getSupportAnalytics,
  getSupportTicket,
  listSupportTickets,
  listTicketMessages,
  suggestSupportTicketResponse,
  updateSupportTicket,
} from "@/lib/api/support-tickets";
import { supportTicketKeys } from "@/lib/customer-support/query-keys";
import type {
  CreateSupportCategoryInput,
  CreateSupportMessageInput,
  CreateSupportTicketInput,
  ListSupportTicketsParams,
  UpdateSupportCategoryInput,
  UpdateSupportTicketInput,
} from "@/lib/customer-support/types";

import { useAuthToken } from "./use-auth-token";

export function useSupportCategories(activeOnly = false) {
  const token = useAuthToken();

  return useQuery({
    queryKey: supportTicketKeys.categoryList(activeOnly),
    queryFn: () => listSupportCategories(token!, activeOnly),
    enabled: Boolean(token),
  });
}

export function useSupportAnalytics() {
  const token = useAuthToken();

  return useQuery({
    queryKey: supportTicketKeys.analytics(),
    queryFn: () => getSupportAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useSupportTickets(params?: ListSupportTicketsParams) {
  const token = useAuthToken();

  return useQuery({
    queryKey: supportTicketKeys.list(params),
    queryFn: () => listSupportTickets(token!, params),
    enabled: Boolean(token),
  });
}

export function useSupportTicket(ticketId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: supportTicketKeys.detail(ticketId),
    queryFn: () => getSupportTicket(token!, ticketId),
    enabled: Boolean(token) && Boolean(ticketId),
  });
}

export function useTicketMessages(ticketId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: supportTicketKeys.messages(ticketId),
    queryFn: () => listTicketMessages(token!, ticketId),
    enabled: Boolean(token) && Boolean(ticketId),
  });
}

export function useCreateSupportCategory() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSupportCategoryInput) =>
      createSupportCategory(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.categories() });
    },
  });
}

export function useUpdateSupportCategory(categoryId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSupportCategoryInput) =>
      updateSupportCategory(token!, categoryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.categories() });
    },
  });
}

export function useDeleteSupportCategory() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteSupportCategory(token!, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.categories() });
    },
  });
}

export function useCreateSupportTicket() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSupportTicketInput) =>
      createSupportTicket(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.analytics() });
    },
  });
}

export function useUpdateSupportTicket(ticketId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSupportTicketInput) =>
      updateSupportTicket(token!, ticketId, input),
    onSuccess: (ticket) => {
      queryClient.setQueryData(supportTicketKeys.detail(ticketId), (prev) =>
        prev ? { ...prev, ...ticket } : prev,
      );
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.detail(ticketId) });
    },
  });
}

export function useDeleteSupportTicket() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => deleteSupportTicket(token!, ticketId),
    onSuccess: (_data, ticketId) => {
      queryClient.removeQueries({ queryKey: supportTicketKeys.detail(ticketId) });
      queryClient.removeQueries({ queryKey: supportTicketKeys.messages(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.analytics() });
    },
  });
}

export function useCreateTicketMessage(ticketId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSupportMessageInput) =>
      createTicketMessage(token!, ticketId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.messages(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.analytics() });
    },
  });
}

export function useSuggestSupportTicketResponse(ticketId: string) {
  const token = useAuthToken();

  return useMutation({
    mutationFn: () => suggestSupportTicketResponse(token!, ticketId),
  });
}

export type { ListSupportTicketsParams };
