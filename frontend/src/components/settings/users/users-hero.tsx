"use client";

import { Shield, UserCheck, Users, UserX } from "lucide-react";

import { computeUsersStats } from "@/config/users";
import type { User } from "@/lib/users/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface UsersHeroProps {
  users: User[];
}

export function UsersHero({ users }: UsersHeroProps) {
  const accent = dashboardAccents.emerald;
  const stats = computeUsersStats(users);

  const heroStats = [
    { icon: Users, label: "Total users", value: stats.total },
    { icon: UserCheck, label: "Active", value: stats.active },
    { icon: UserX, label: "Inactive", value: stats.inactive },
    { icon: Shield, label: "Admins", value: stats.admins },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Settings · Users
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Manage{" "}
            <span className={accent.text}>organization users</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            View human accounts, edit profiles, assign roles, and control account
            activation across your workspace.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
          {heroStats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl border",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <Icon className={cn("size-4", accent.text)} />
              </div>
              <div>
                <p className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
