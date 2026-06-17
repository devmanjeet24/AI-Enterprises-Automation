"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  dashboardNavItems,
  dashboardSettingsItem,
  type DashboardNavItem,
} from "@/config/dashboard";
import { siteConfig } from "@/config/site";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { canAccessSettings, filterNavByPermissions } from "@/lib/auth/nav-access";
import { useAppDispatch } from "@/store/hooks";
import { toggleSidebarCollapsed } from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";

import { SidebarTooltip } from "./sidebar-tooltip";

interface DashboardSidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

const navAccents: Record<string, string> = {
  "/overview": "text-[#f5c518]",
  "/ai-employees": "text-[#4ADE80]",
  "/knowledge-base": "text-[#A78BFA]",
  "/agent-teams": "text-[#6B9BF8]",
  "/workflows": "text-[#f5c518]",
  "/research-hub": "text-[#A78BFA]",
  "/browser-automation": "text-[#6B9BF8]",
  "/customer-support": "text-[#6B9BF8]",
  "/voice-ai": "text-[#4ADE80]",
  "/omnichannel": "text-[#A78BFA]",
  "/analytics": "text-[#4ADE80]",
  "/settings": "text-muted-foreground",
};

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

function SidebarNavItem({
  item,
  isCollapsed,
  pathname,
  onNavigate,
}: {
  item: DashboardNavItem;
  isCollapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = item.enabled && isNavItemActive(pathname, item.href);
  const Icon = item.icon;
  const accentClass = navAccents[item.href] ?? "text-muted-foreground";

  const itemContent = !item.enabled ? (
    <span
      className={cn(
        "flex w-full cursor-not-allowed items-center rounded-xl text-muted-foreground/40",
        isCollapsed ? "size-10 justify-center" : "gap-3 px-3 py-2.5 text-[14px] font-medium",
      )}
    >
      <Icon className="size-[18px] shrink-0 opacity-40" />
      <span
        className={cn(
          "truncate transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
        )}
      >
        {item.label}
      </span>
    </span>
  ) : (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex w-full items-center rounded-xl text-[14px] font-medium transition-all duration-200",
        isCollapsed ? "size-10 justify-center" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-white/[0.06] text-foreground"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      {isActive && !isCollapsed && (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#f5c518]"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          isActive ? accentClass : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span
        className={cn(
          "truncate transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
        )}
      >
        {item.label}
      </span>
    </Link>
  );

  return (
    <SidebarTooltip
      label={item.enabled ? item.label : `${item.label} (soon)`}
      show={isCollapsed}
    >
      {itemContent}
    </SidebarTooltip>
  );
}

export function DashboardSidebar({ collapsed, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const permissions = useUserPermissions();
  const isCollapsed = collapsed;

  const visibleNavItems = filterNavByPermissions(dashboardNavItems, permissions);
  const showSettings = canAccessSettings(permissions);

  return (
    <aside className="flex h-screen flex-col overflow-hidden">
      <div
        className={cn(
          "flex h-[60px] shrink-0 items-center border-b border-white/[0.06]",
          isCollapsed ? "justify-center px-2" : "justify-between gap-2 px-4",
        )}
      >
        <Link
          href="/overview"
          className={cn(
            "flex min-w-0 items-center overflow-hidden transition-opacity hover:opacity-85",
            isCollapsed ? "justify-center" : "gap-3",
          )}
          onClick={onNavigate}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-gradient-to-br from-[#f5c518]/15 to-[#6B9BF8]/10 text-sm font-bold text-[#f5c518]">
            {siteConfig.name[0]}
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-[15px] font-semibold tracking-[-0.02em] text-foreground transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            {siteConfig.name}
            <span className="font-normal text-muted-foreground">.ai</span>
          </span>
        </Link>

        {!isCollapsed && (
          <button
            type="button"
            onClick={() => dispatch(toggleSidebarCollapsed())}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-muted-foreground transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex shrink-0 justify-center border-b border-white/[0.06] py-2">
          <button
            type="button"
            onClick={() => dispatch(toggleSidebarCollapsed())}
            className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] text-muted-foreground transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      )}

      <nav
        className={cn(
          "min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden overscroll-contain py-4",
          isCollapsed ? "px-2" : "px-3",
        )}
        aria-label="Dashboard"
      >
        {visibleNavItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isCollapsed={isCollapsed}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {showSettings && (
      <div
        className={cn(
          "shrink-0 border-t border-white/[0.06] py-3",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        <SidebarNavItem
          item={dashboardSettingsItem}
          isCollapsed={isCollapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>
      )}
    </aside>
  );
}
