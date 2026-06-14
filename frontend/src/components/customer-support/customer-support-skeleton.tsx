import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />;
}

export function CustomerSupportStatsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCard key={index} variant="panel" accent="blue" interactive={false} className="p-5">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="mt-4 h-8 w-12" />
        </DashboardCard>
      ))}
    </div>
  );
}

export function SupportTicketCardGridSkeleton() {
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
          <SkeletonBar className="mt-5 h-8 w-full rounded-lg" />
        </DashboardCard>
      ))}
    </div>
  );
}

/** @deprecated Use hero + SupportTicketCardGridSkeleton with stats skeleton. */
export function CustomerSupportSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-6 md:px-8">
      <div className="h-32 rounded-2xl bg-white/[0.04]" />
      <CustomerSupportStatsSkeleton />
      <SupportTicketCardGridSkeleton />
    </div>
  );
}

export function CustomerSupportDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 rounded-2xl bg-white/[0.04]" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-96 rounded-2xl bg-white/[0.04]" />
        <div className="h-96 rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

export function CustomerSupportDetailPageSkeleton() {
  return (
    <div className="pb-10 md:pb-12">
      <div className="border-b border-white/[0.06] px-6 py-6 md:px-8">
        <SkeletonBar className="h-4 w-28" />
        <div className="mt-4 flex items-start gap-4">
          <SkeletonBar className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-7 w-2/5 max-w-md" />
            <SkeletonBar className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="px-6 py-8 md:px-8">
        <CustomerSupportDetailSkeleton />
      </div>
    </div>
  );
}
