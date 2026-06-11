import * as React from "react";

import { cn } from "@/lib/utils";

type ContainerSize = "default" | "narrow" | "wide";

const sizeClasses: Record<ContainerSize, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-6", sizeClasses[size], className)}
      {...props}
    />
  );
}

export { Container };
