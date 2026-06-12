"use client";

import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { StoreProvider } from "@/store/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthBootstrap />
      <QueryProvider>
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </StoreProvider>
  );
}
