import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function AnalyticsKpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="kpi"
          accent="neutral"
          interactive={false}
          className="p-5"
        >
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="mt-4 h-8 w-12" />
          <SkeletonBar className="mt-3 h-3 w-28" />
        </DashboardCard>
      ))}
    </div>
  );
}

export function AnalyticsChartSkeleton() {
  return (
    <DashboardCard variant="panel" accent="neutral" interactive={false} className="p-5">
      <SkeletonBar className="h-4 w-40" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between">
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBar className="h-3 w-8" />
            </div>
            <SkeletonBar className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export function AnalyticsHeroSkeleton() {
  return (
    <div className="space-y-4 border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="h-10 w-2/5 max-w-md" />
      <SkeletonBar className="h-4 w-full max-w-xl" />
      <div className="mt-6 flex gap-6">
        <SkeletonBar className="h-10 w-24" />
        <SkeletonBar className="h-10 w-24" />
        <SkeletonBar className="h-10 w-24" />
        <SkeletonBar className="h-10 w-24" />
      </div>
    </div>
  );
}

export function AnalyticsNavSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto px-6 pb-4 pt-2 md:px-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonBar key={index} className="h-9 w-28 shrink-0 rounded-xl" />
      ))}
    </div>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <div className="pb-10 md:pb-12">
      <AnalyticsHeroSkeleton />
      <AnalyticsNavSkeleton />
      <div className="mt-10 space-y-10 px-6 md:mt-12 md:space-y-12 md:px-8">
        <AnalyticsKpiSkeleton />
        <div className="grid gap-4 lg:grid-cols-2">
          <AnalyticsChartSkeleton />
          <AnalyticsChartSkeleton />
        </div>
      </div>
    </div>
  );
}
