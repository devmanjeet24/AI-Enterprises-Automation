"use client";

import { useAppSelector } from "@/store/hooks";

export function useAuthToken(): string | null {
  return useAppSelector((state) => state.auth.accessToken);
}

export function useUserPermissions(): string[] {
  return useAppSelector((state) => state.auth.user?.permissions ?? []);
}
