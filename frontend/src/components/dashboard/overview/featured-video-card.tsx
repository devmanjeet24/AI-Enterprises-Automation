"use client";

import { heroVideoUrl } from "@/config/landing";
import { cn } from "@/lib/utils";

import { DashboardCard } from "../dashboard-card";

interface FeaturedVideoCardProps {
  className?: string;
}

export function FeaturedVideoCard({ className }: FeaturedVideoCardProps) {
  return (
    <DashboardCard
      variant="media"
      accent="blue"
      interactive={false}
      className={cn("h-full min-h-[200px]", className)}
    >
      <div className="relative size-full min-h-[200px]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 size-full object-cover"
          aria-hidden
        >
          <source src={heroVideoUrl} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/85 via-[#0a0f1a]/15 to-[#0a0f1a]/10" />

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B9BF8]">
            Live preview
          </p>
          <p className="mt-1 text-[14px] font-medium leading-snug text-white">
            AI employees in action
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
