"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSelector } from "@/store/hooks";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isHydrated = useAppSelector((state) => state.app.isHydrated);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
