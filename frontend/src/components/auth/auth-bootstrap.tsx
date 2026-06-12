"use client";

import { useEffect } from "react";

import { restoreSession } from "@/lib/auth/session";
import { useAppDispatch } from "@/store/hooks";
import { setHydrated } from "@/store/slices/app-slice";

export function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await restoreSession(dispatch);
      } finally {
        if (!cancelled) {
          dispatch(setHydrated(true));
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}
