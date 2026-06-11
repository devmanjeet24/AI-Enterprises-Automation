"use client";

import { QueryProvider } from "@/providers/query-provider";
import { StoreProvider } from "@/store/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <QueryProvider>{children}</QueryProvider>
    </StoreProvider>
  );
}
