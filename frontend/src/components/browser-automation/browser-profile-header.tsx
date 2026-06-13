"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getProfileInitials } from "@/config/browser-automation";
import type { BrowserProfile } from "@/lib/browser-automation/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface BrowserProfileHeaderProps {
  profile: BrowserProfile;
  actions?: React.ReactNode;
}

export function BrowserProfileHeader({ profile, actions }: BrowserProfileHeaderProps) {
  const accent = dashboardAccents.blue;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <Link href="/browser-automation">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back to Browser Automation
        </Button>
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl border text-[13px] font-semibold",
              accent.bgSubtle,
              accent.border,
              accent.text,
            )}
          >
            {getProfileInitials(profile.name)}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Browser Profile
            </p>
            <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
              {profile.name}
            </h1>
            <p className="mt-1 font-mono text-[13px] text-muted-foreground">{profile.slug}</p>
            <div className="mt-3">
              {profile.is_active ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[11px] font-medium text-tertiary">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {actions && <div className="w-full max-w-xs shrink-0">{actions}</div>}
      </div>
    </section>
  );
}
