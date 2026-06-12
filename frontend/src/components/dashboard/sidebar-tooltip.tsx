"use client";

import { cn } from "@/lib/utils";

interface SidebarTooltipProps {
  label: string;
  show: boolean;
  children: React.ReactNode;
}

export function SidebarTooltip({ label, show, children }: SidebarTooltipProps) {
  if (!show) return <>{children}</>;

  return (
    <div className="group/tooltip relative flex w-full justify-center">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2",
          "whitespace-nowrap rounded-lg border border-white/[0.1] bg-[#141c2f]/95 px-2.5 py-1.5",
          "text-[13px] font-medium text-foreground shadow-lg backdrop-blur-md",
          "opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100",
        )}
      >
        {label}
      </span>
    </div>
  );
}
