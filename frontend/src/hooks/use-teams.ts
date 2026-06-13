"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  updateTeam,
} from "@/lib/api/teams";
import { dashboardKeys } from "@/lib/dashboard/query-keys";
import { teamKeys } from "@/lib/teams/query-keys";
import type { CreateTeamInput, UpdateTeamInput } from "@/lib/teams/types";

import { useAuthToken } from "./use-auth-token";

export function useTeams() {
  const token = useAuthToken();

  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: () => listTeams(token!),
    enabled: Boolean(token),
  });
}

export function useTeam(teamId: string) {
  const token = useAuthToken();

  return useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeam(token!, teamId),
    enabled: Boolean(token) && Boolean(teamId),
  });
}

export function useCreateTeam() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) => createTeam(token!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useUpdateTeam(teamId: string) {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTeamInput) => updateTeam(token!, teamId, input),
    onSuccess: (team) => {
      queryClient.setQueryData(teamKeys.detail(teamId), team);
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}

export function useDeleteTeam() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => deleteTeam(token!, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}
