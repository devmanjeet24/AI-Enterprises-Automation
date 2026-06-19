"use client";

import { useEffect } from "react";

import { getCurrentUser } from "@/lib/api/auth";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/auth-slice";

import { useAuthToken } from "./use-auth-token";

/** Refresh `/auth/me` so permission changes are reflected without re-login. */
export function useRefreshCurrentUser() {
  const dispatch = useAppDispatch();
  const token = useAuthToken();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void getCurrentUser(token)
      .then((user) => {
        if (!cancelled) {
          dispatch(setUser(user));
        }
      })
      .catch(() => {
        // Ignore — AuthGuard / API calls will surface auth errors.
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, token]);
}
