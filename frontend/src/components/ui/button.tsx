import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        brand:
          "bg-brand text-primary-foreground hover:bg-brand-hover shadow-glow-sm hover:shadow-glow",
        default:
          "bg-primary text-primary-foreground hover:bg-brand-hover",
        secondary:
          "bg-secondary text-secondary-foreground border border-border-default hover:bg-surface-hover hover:border-border-strong",
        outline:
          "border border-border-default bg-transparent text-foreground hover:bg-surface hover:border-border-strong",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-surface",
        glass:
          "glass text-foreground hover:border-border-strong hover:bg-surface/50",
        link: "text-brand underline-offset-4 hover:underline",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
      size: {
        default: "h-10 px-5 text-sm rounded-full",
        sm: "h-8 px-4 text-xs rounded-full",
        lg: "h-11 px-6 text-sm rounded-full",
        xl: "h-12 px-8 text-base rounded-full",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
