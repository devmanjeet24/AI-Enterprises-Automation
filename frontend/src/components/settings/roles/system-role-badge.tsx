import { cn } from "@/lib/utils";

interface SystemRoleBadgeProps {
  className?: string;
}

export function SystemRoleBadge({ className }: SystemRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-medium text-purple-300",
        className,
      )}
    >
      System
    </span>
  );
}
