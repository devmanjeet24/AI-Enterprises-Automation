import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function WorkflowCardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="default"
          accent="purple"
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
            <SkeletonBar className="h-6 w-16 rounded-full" />
            <SkeletonBar className="h-6 w-20 rounded-full" />
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}

export function WorkflowStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCard
          key={index}
          variant="kpi"
          accent="purple"
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

export function WorkflowDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-8 w-2/5 max-w-md" />
        <SkeletonBar className="h-4 w-32" />
      </div>
      <SkeletonBar className="h-10 w-full max-w-lg rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard variant="panel" interactive={false} className="h-80 p-6">
          <SkeletonBar className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBar key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </DashboardCard>
        <DashboardCard variant="panel" interactive={false} className="h-80 p-6">
          <SkeletonBar className="h-4 w-28" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBar key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
