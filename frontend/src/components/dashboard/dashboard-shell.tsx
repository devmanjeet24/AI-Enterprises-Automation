"use client";

import { useState } from "react";

import { SectionAmbient } from "@/components/landing/section-ambient";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const sidebarExpanded = mobileOpen || !sidebarCollapsed;

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <SectionAmbient variant="cool" className="fixed inset-0 opacity-60" />
      <div className="section-grid-fade pointer-events-none fixed inset-0 opacity-20" aria-hidden />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar — always fixed, full viewport height */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen border-r border-white/[0.06] bg-[#0c1220]/95 backdrop-blur-xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarExpanded ? "w-[252px]" : "w-[72px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <DashboardSidebar
          collapsed={!sidebarExpanded}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {/* Main — offset by sidebar width on desktop; only this area scrolls */}
      <div
        className={cn(
          "flex h-screen min-w-0 flex-col overflow-hidden transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarExpanded ? "lg:ml-[252px]" : "lg:ml-[72px]",
        )}
      >
        <DashboardHeader onMenuToggle={() => setMobileOpen((open) => !open)} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
