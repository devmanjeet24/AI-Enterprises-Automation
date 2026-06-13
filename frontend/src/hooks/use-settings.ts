"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getOrganization, updateOrganization } from "@/lib/api/organizations";
import { settingsKeys } from "@/lib/settings/query-keys";
import type { UpdateOrganizationInput } from "@/lib/settings/types";

import { useAuthToken } from "./use-auth-token";

export function useOrganization() {
  const token = useAuthToken();

  return useQuery({
    queryKey: settingsKeys.organization(),
    queryFn: () => getOrganization(token!),
    enabled: Boolean(token),
  });
}

export function useUpdateOrganization() {
  const token = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(token!, input),
    onSuccess: (organization) => {
      queryClient.setQueryData(settingsKeys.organization(), organization);
    },
  });
}
