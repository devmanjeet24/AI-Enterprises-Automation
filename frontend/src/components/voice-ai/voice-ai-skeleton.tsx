"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function VoiceAiStatsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCard key={index} variant="panel" accent="emerald" interactive={false} className="p-5">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="mt-4 h-8 w-12" />
        </DashboardCard>
      ))}
    </div>
  );
}

export function VoiceAgentCardGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="default"
          accent="emerald"
          interactive={false}
          className="p-5"
        >
          <div className="flex items-start gap-3">
            <SkeletonBar className="size-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/5" />
              <SkeletonBar className="h-3 w-1/3" />
            </div>
          </div>
          <SkeletonBar className="mt-4 h-3 w-full" />
          <SkeletonBar className="mt-5 h-8 w-full rounded-lg" />
        </DashboardCard>
      ))}
    </div>
  );
}

/** @deprecated Use VoiceAiStatsSkeleton and VoiceAgentCardGridSkeleton with hero visible. */
export function VoiceAiSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-6 py-8 md:px-8">
      <div className="h-40 rounded-xl bg-white/[0.04]" />
      <VoiceAiStatsSkeleton />
      <VoiceAgentCardGridSkeleton />
    </div>
  );
}

export function VoiceAiDetailContentSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 px-6 pt-8 md:grid-cols-3 md:px-8">
      <DashboardCard variant="panel" accent="emerald" interactive={false} className="h-56 p-5 md:col-span-1">
        <SkeletonBar className="h-4 w-28" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBar key={index} className="h-8 w-full" />
          ))}
        </div>
      </DashboardCard>
      <div className="space-y-3 md:col-span-2">
        <SkeletonBar className="h-4 w-32" />
        {Array.from({ length: 3 }).map((_, index) => (
          <DashboardCard key={index} variant="default" accent="emerald" interactive={false} className="h-20 p-4">
            <SkeletonBar className="h-full w-full" />
          </DashboardCard>
        ))}
      </div>
    </div>
  );
}

export function VoiceAiDetailSkeleton() {
  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-4">
          <SkeletonBar className="h-4 w-36" />
          <SkeletonBar className="h-8 w-64 max-w-full" />
          <SkeletonBar className="h-4 w-40" />
        </div>
      </div>
      <VoiceAiDetailContentSkeleton />
    </div>
  );
}

export function VoiceAiSessionDetailSkeleton() {
  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-4">
          <SkeletonBar className="h-4 w-40" />
          <SkeletonBar className="h-8 w-72 max-w-full" />
          <SkeletonBar className="h-4 w-56" />
        </div>
      </div>
      <div className="animate-pulse px-6 pt-8 md:px-8">
        <SkeletonBar className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
