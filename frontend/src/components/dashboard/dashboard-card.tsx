"use client";

import Link from "next/link";

import {
  dashboardAccents,
  type DashboardAccent,
} from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

type DashboardCardVariant = "default" | "kpi" | "list" | "media" | "panel";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  variant?: DashboardCardVariant;
  accent?: DashboardAccent;
}

const variantStyles: Record<DashboardCardVariant, string> = {
  default:
    "rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl",
  kpi:
    "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-xl",
  list:
    "rounded-2xl border border-white/[0.07] bg-[#0f1629]/60 backdrop-blur-xl",
  media:
    "rounded-2xl border border-white/[0.09] bg-[#0a0f1a] p-0 overflow-hidden",
  panel:
    "rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg",
};

export function DashboardCard({
  children,
  className,
  interactive = true,
  variant = "default",
  accent = "neutral",
}: DashboardCardProps) {
  const accentStyles = dashboardAccents[accent];

  return (
    <div
      className={cn(
        "group/card relative transition-[border-color,box-shadow,transform] duration-300",
        variantStyles[variant],
        interactive &&
          variant !== "media" &&
          "hover:-translate-y-px hover:border-white/[0.12] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
        accent !== "neutral" && accentStyles.border,
        accent !== "neutral" && interactive && accentStyles.borderHover,
        className,
      )}
    >
      {variant !== "media" && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
            }}
          />
          {accent !== "neutral" && (
            <div
              className={cn(
                "pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br to-transparent opacity-60",
                accentStyles.glow,
              )}
            />
          )}
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

interface DashboardCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href?: string };
  accent?: DashboardAccent;
  className?: string;
}

export function DashboardCardHeader({
  title,
  subtitle,
  action,
  accent = "neutral",
  className,
}: DashboardCardHeaderProps) {
  const accentStyles = dashboardAccents[accent];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="truncate text-[14px] font-medium tracking-[-0.01em] text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className={cn(
              "shrink-0 text-[12px] font-medium transition-colors",
              accent === "neutral" ? "text-brand hover:text-brand-hover" : accentStyles.textMuted,
            )}
          >
            {action.label}
          </Link>
        ) : (
          <span className="shrink-0 text-[12px] font-medium text-tertiary">
            {action.label}
          </span>
        ))}
    </div>
  );
}

interface DashboardSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function DashboardSectionHeader({
  eyebrow,
  title,
  description,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <div className={cn("mb-5", className)}>
      {eyebrow && (
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-xl font-medium tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
