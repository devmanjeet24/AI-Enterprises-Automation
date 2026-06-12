"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { StaggerGrid, StaggerItem } from "./stagger-grid";

interface BulletListProps {
  items: string[];
  className?: string;
}

export function BulletList({ items, className }: BulletListProps) {
  return (
    <StaggerGrid className={cn("mt-8 space-y-2", className)}>
      {items.map((bullet) => (
        <StaggerItem key={bullet}>
          <div className="premium-bullet group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all duration-300 hover:border-border hover:bg-white/[0.02]">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand-muted/50 transition-colors duration-300 group-hover:border-brand/40 group-hover:bg-brand-muted">
              <Check className="size-3 text-brand" />
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/90">
              {bullet}
            </span>
          </div>
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
}
