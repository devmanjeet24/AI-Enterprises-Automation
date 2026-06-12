"use client";

import { Bell, Building2, ChevronDown, LogOut, Search, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { defaultOrganization } from "@/config/dashboard";
import { siteConfig } from "@/config/site";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const orgName = user?.organization_name ?? defaultOrganization.name;
  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : "Demo User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-background/80 px-4 backdrop-blur-xl md:px-5">
      {onMenuToggle && (
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground lg:hidden"
          aria-label="Toggle sidebar"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block h-px w-3.5 bg-current" />
            <span className="block h-px w-3.5 bg-current" />
          </span>
        </button>
      )}

      <div className="flex min-w-0 items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03]">
          <Building2 className="size-3.5 text-brand" />
        </div>
        <p className="truncate text-[13px] font-medium tracking-[-0.01em] text-foreground">
          {orgName}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            placeholder="Search…"
            className="h-8 w-52 rounded-lg border border-white/[0.07] bg-white/[0.03] pl-9 pr-3 text-[12px] text-foreground placeholder:text-tertiary transition-colors hover:border-white/[0.1] focus:border-white/[0.14] focus:bg-white/[0.04] focus:outline-none focus:ring-1 focus:ring-ring/25 lg:w-60"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 shrink-0 rounded-lg border border-white/[0.07]"
          aria-label="Notifications"
        >
          <Bell className="size-3.5" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" />
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] py-1 pl-1 pr-2 transition-colors hover:border-white/[0.1] hover:bg-white/[0.05]"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-brand-muted text-[10px] font-semibold text-brand">
              {initials}
            </span>
            <ChevronDown
              className={cn(
                "size-3 text-tertiary transition-transform",
                profileOpen && "rotate-180",
              )}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1629]/98 p-1 shadow-lg backdrop-blur-xl"
            >
              <div className="border-b border-white/[0.06] px-3 py-2">
                <p className="truncate text-[13px] font-medium text-foreground">{displayName}</p>
                <p className="truncate text-[11px] text-tertiary">
                  {user?.email ?? "demo@acme.com"}
                </p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  <User className="size-3.5" />
                  Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  <Settings className="size-3.5" />
                  Settings
                </button>
              </div>
              <div className="border-t border-white/[0.06] pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    dispatch(clearAuth());
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
                <Link
                  href="/"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                  onClick={() => setProfileOpen(false)}
                >
                  {siteConfig.name} home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
