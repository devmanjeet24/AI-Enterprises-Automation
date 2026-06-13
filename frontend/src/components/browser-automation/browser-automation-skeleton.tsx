import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function BrowserProfileCardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="default"
          accent="blue"
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
        </DashboardCard>
      ))}
    </div>
  );
}

export function BrowserTaskCardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="default"
          accent="blue"
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
          <SkeletonBar className="mt-2 h-3 w-4/5" />
          <div className="mt-5 flex gap-2">
            <SkeletonBar className="h-6 w-20 rounded-full" />
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}

export function BrowserAutomationStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="kpi"
          accent="blue"
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

export function BrowserAutomationPageSkeleton() {
  return (
    <div className="space-y-10 px-6 pb-10 md:px-8">
      <div className="space-y-4 border-b border-white/[0.05] pb-8 pt-7">
        <SkeletonBar className="h-3 w-32" />
        <SkeletonBar className="h-10 w-2/5 max-w-md" />
        <SkeletonBar className="h-4 w-full max-w-xl" />
      </div>
      <BrowserAutomationStatsSkeleton />
      <BrowserProfileCardSkeleton />
      <BrowserTaskCardGridSkeleton />
    </div>
  );
}

export function BrowserTaskDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-white/[0.05] pb-8 pt-7">
        <SkeletonBar className="h-8 w-48" />
        <div className="flex items-start gap-4">
          <SkeletonBar className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-8 w-2/5 max-w-sm" />
            <SkeletonBar className="h-4 w-32" />
          </div>
        </div>
      </div>
      <SkeletonBar className="h-10 w-full max-w-md rounded-xl" />
      <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
        <SkeletonBar className="h-4 w-32" />
        <SkeletonBar className="mt-4 h-10 w-28" />
      </DashboardCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-40" />
          <SkeletonBar className="mt-6 h-10 w-full" />
          <SkeletonBar className="mt-4 h-10 w-full" />
          <SkeletonBar className="mt-4 h-24 w-full" />
        </DashboardCard>
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="mt-6 h-3 w-full" />
          <SkeletonBar className="mt-3 h-3 w-4/5" />
        </DashboardCard>
      </div>
    </div>
  );
}

export function BrowserProfileDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-white/[0.05] pb-8 pt-7">
        <SkeletonBar className="h-8 w-48" />
        <div className="flex items-start gap-4">
          <SkeletonBar className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-8 w-2/5 max-w-sm" />
            <SkeletonBar className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-40" />
          <SkeletonBar className="mt-6 h-10 w-full" />
          <SkeletonBar className="mt-4 h-10 w-full" />
        </DashboardCard>
        <DashboardCard variant="panel" accent="blue" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="mt-6 h-3 w-full" />
        </DashboardCard>
      </div>
    </div>
  );
}
