import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/[0.06]",
        className,
      )}
    />
  );
}

export function DocumentListSkeleton() {
  return (
    <DashboardCard variant="list" accent="purple" interactive={false}>
      <div className="border-b border-white/[0.06] px-5 py-4">
        <SkeletonBar className="h-4 w-32" />
        <SkeletonBar className="mt-2 h-3 w-48" />
      </div>
      <div className="divide-y divide-white/[0.05]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            <SkeletonBar className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/5" />
              <SkeletonBar className="h-3 w-1/4" />
            </div>
            <SkeletonBar className="hidden h-6 w-16 rounded-full sm:block" />
            <SkeletonBar className="hidden h-3 w-20 md:block" />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export function KnowledgeBaseStatsSkeleton() {
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
          <SkeletonBar className="mt-4 h-8 w-16" />
          <SkeletonBar className="mt-3 h-3 w-28" />
        </DashboardCard>
      ))}
    </div>
  );
}

export function DocumentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-8 w-2/5 max-w-md" />
        <SkeletonBar className="h-4 w-32" />
      </div>
      <DashboardCard variant="panel" interactive={false} className="p-6">
        <div className="flex justify-between gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <SkeletonBar className="size-10 rounded-full" />
              <SkeletonBar className="h-3 w-16" />
            </div>
          ))}
        </div>
      </DashboardCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard variant="panel" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-28" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex justify-between gap-4">
                <SkeletonBar className="h-3 w-24" />
                <SkeletonBar className="h-3 w-32" />
              </div>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard variant="panel" interactive={false} className="p-6">
          <SkeletonBar className="h-4 w-20" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBar key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
