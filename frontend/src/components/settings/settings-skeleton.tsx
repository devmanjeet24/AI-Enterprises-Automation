import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function SettingsStatsSkeleton() {
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

export function SettingsNavGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="default"
          accent="neutral"
          interactive={false}
          className="p-5"
        >
          <div className="flex items-start gap-3">
            <SkeletonBar className="size-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/5" />
              <SkeletonBar className="h-3 w-full" />
            </div>
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-10 px-6 pb-10 md:px-8">
      <div className="space-y-4 border-b border-white/[0.05] pb-8 pt-7">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-10 w-2/5 max-w-md" />
        <SkeletonBar className="h-4 w-full max-w-xl" />
        <div className="mt-6 flex gap-6">
          <SkeletonBar className="h-10 w-24" />
          <SkeletonBar className="h-10 w-24" />
          <SkeletonBar className="h-10 w-24" />
        </div>
      </div>
      <SettingsStatsSkeleton />
      <SettingsNavGridSkeleton />
    </div>
  );
}

export function OrganizationPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-white/[0.05] pb-8 pt-7">
        <SkeletonBar className="h-8 w-40" />
        <SkeletonBar className="h-8 w-2/5 max-w-sm" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard variant="panel" accent="neutral" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-40" />
          <SkeletonBar className="mt-6 h-10 w-full" />
          <SkeletonBar className="mt-4 h-24 w-full" />
        </DashboardCard>
        <DashboardCard variant="panel" accent="neutral" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="mt-6 h-3 w-full" />
          <SkeletonBar className="mt-3 h-3 w-4/5" />
        </DashboardCard>
      </div>
    </div>
  );
}
