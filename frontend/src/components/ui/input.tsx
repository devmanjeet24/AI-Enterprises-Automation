import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-white/[0.04] px-4 text-sm text-foreground transition-colors duration-200",
          "placeholder:text-tertiary",
          "hover:border-border-default",
          "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
