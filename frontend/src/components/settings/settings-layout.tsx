"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsLayout({
  eyebrow = "Settings",
  title,
  description,
  backHref = "/settings",
  backLabel = "Back to Settings",
  children,
  className,
}: SettingsLayoutProps) {
  return (
    <div className={cn("pb-10 md:pb-12", className)}>
      <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground">
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </Button>
        </Link>
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </section>
      <div className="mt-8 px-6 md:mt-10 md:px-8">{children}</div>
    </div>
  );
}
