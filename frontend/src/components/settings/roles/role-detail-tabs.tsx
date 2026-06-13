"use client";

import { cn } from "@/lib/utils";

export type RoleDetailTab = "configure" | "permissions";

const tabs: { id: RoleDetailTab; label: string }[] = [
  { id: "configure", label: "Configure" },
  { id: "permissions", label: "Permissions" },
];

interface RoleDetailTabsProps {
  activeTab: RoleDetailTab;
  onTabChange: (tab: RoleDetailTab) => void;
  permissionCount?: number;
}

export function RoleDetailTabs({
  activeTab,
  onTabChange,
  permissionCount,
}: RoleDetailTabsProps) {
  const tabLabels: Record<RoleDetailTab, string> = {
    configure: "Configure",
    permissions:
      permissionCount != null && permissionCount > 0
        ? `Permissions (${permissionCount})`
        : "Permissions",
  };

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors",
            activeTab === tab.id
              ? "bg-white/[0.08] text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tabLabels[tab.id]}
        </button>
      ))}
    </div>
  );
}
