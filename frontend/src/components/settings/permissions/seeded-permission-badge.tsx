import { cn } from "@/lib/utils";

interface SeededPermissionBadgeProps {
  className?: string;
}

export function SeededPermissionBadge({ className }: SeededPermissionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300",
        className,
      )}
    >
      Default
    </span>
  );
}
