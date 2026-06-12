"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAppSelector } from "@/store/hooks";

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const isHydrated = useAppSelector((state) => state.app.isHydrated);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/overview");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
