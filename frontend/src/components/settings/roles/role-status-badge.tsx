import { cn } from "@/lib/utils";

interface RoleStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function RoleStatusBadge({ isActive, className }: RoleStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        isActive
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-white/[0.08] bg-white/[0.03] text-muted-foreground",
        className,
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
