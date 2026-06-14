"use client";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function OmnichannelStatsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <DashboardCard key={i} variant="panel" accent="purple" interactive={false} className="p-5">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="mt-4 h-8 w-12" />
        </DashboardCard>
      ))}
    </div>
  );
}

export function OmnichannelChannelGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="default"
          accent="purple"
          interactive={false}
          className="p-5"
        >
          <SkeletonBar className="h-4 w-2/5" />
          <SkeletonBar className="mt-3 h-3 w-1/3" />
          <SkeletonBar className="mt-4 h-6 w-20 rounded-full" />
          <SkeletonBar className="mt-5 h-4 w-28" />
        </DashboardCard>
      ))}
    </div>
  );
}

export function OmnichannelInboxSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCard key={index} variant="default" accent="purple" interactive={false} className="p-4">
          <SkeletonBar className="h-4 w-2/5" />
          <SkeletonBar className="mt-2 h-3 w-1/3" />
          <SkeletonBar className="mt-3 h-10 w-full" />
        </DashboardCard>
      ))}
    </div>
  );
}

/** @deprecated Use hero + content-area skeletons. */
export function OmnichannelSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-6 py-8 md:px-8">
      <div className="h-40 rounded-xl bg-white/[0.04]" />
      <OmnichannelStatsSkeleton />
    </div>
  );
}

export function OmnichannelDetailContentSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 px-6 pt-8 md:grid-cols-3 md:px-8">
      <DashboardCard variant="panel" accent="purple" interactive={false} className="h-56 p-5 md:col-span-1">
        <SkeletonBar className="h-4 w-28" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBar key={index} className="h-8 w-full" />
          ))}
        </div>
      </DashboardCard>
      <div className="md:col-span-2">
        <SkeletonBar className="mb-4 h-4 w-32" />
        <OmnichannelInboxSkeleton />
      </div>
    </div>
  );
}

export function OmnichannelDetailSkeleton() {
  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-4">
          <SkeletonBar className="h-4 w-36" />
          <SkeletonBar className="h-8 w-64 max-w-full" />
          <SkeletonBar className="h-4 w-40" />
        </div>
      </div>
      <OmnichannelDetailContentSkeleton />
    </div>
  );
}

export function OmnichannelConversationDetailSkeleton() {
  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <div className="animate-pulse space-y-4">
          <SkeletonBar className="h-4 w-16" />
          <SkeletonBar className="h-8 w-72 max-w-full" />
          <SkeletonBar className="h-4 w-48" />
        </div>
      </div>
      <div className="grid animate-pulse gap-6 px-6 pt-8 lg:grid-cols-[1fr_320px] md:px-8">
        <SkeletonBar className="h-96 rounded-xl" />
        <SkeletonBar className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
