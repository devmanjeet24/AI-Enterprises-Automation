"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { analyticsNavAccents, analyticsNavSections } from "@/config/analytics";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { filterNavByPermissions } from "@/lib/auth/nav-access";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

export function AnalyticsSubNav() {
  const pathname = usePathname();
  const permissions = useUserPermissions();
  const visibleSections = filterNavByPermissions(analyticsNavSections, permissions);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Analytics sections"
      className="border-b border-white/[0.05] px-6 md:px-8"
    >
      <div className="flex gap-2 overflow-x-auto pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleSections.map((section) => {
          const isActive =
            pathname === section.href ||
            (section.href !== "/analytics" && pathname.startsWith(`${section.href}/`)) ||
            (section.href === "/analytics" && pathname === "/analytics");

          const accent = dashboardAccents[analyticsNavAccents[section.id]];

          if (!section.enabled) {
            return (
              <span
                key={section.id}
                title={`${section.title} (coming soon)`}
                className={cn(
                  "inline-flex shrink-0 cursor-not-allowed items-center rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-2 text-[13px] font-medium text-muted-foreground/40",
                )}
              >
                {section.title}
              </span>
            );
          }

          return (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? cn(accent.bgSubtle, accent.border, accent.text)
                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1] hover:text-foreground",
              )}
            >
              {section.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
