"use client";

import { BookOpen, Database, Layers, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { computeDocumentStats } from "@/config/knowledge-base";
import type { KnowledgeDocument } from "@/lib/knowledge-base/types";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface KnowledgeBaseHeroProps {
  documents: KnowledgeDocument[];
  canUpload?: boolean;
  onUploadClick: () => void;
}

export function KnowledgeBaseHero({
  documents,
  canUpload = true,
  onUploadClick,
}: KnowledgeBaseHeroProps) {
  const accent = dashboardAccents.purple;
  const stats = computeDocumentStats(documents);

  const heroStats = [
    { icon: BookOpen, label: "Documents", value: stats.total },
    { icon: Database, label: "Embedded", value: stats.ready },
    { icon: Layers, label: "Chunks", value: stats.totalChunks },
  ] as const;

  return (
    <section className="border-b border-white/[0.05] px-6 pb-8 pt-7 md:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
            Knowledge Base
          </p>
          <h1 className="mt-2 font-display text-[2rem] leading-tight tracking-[-0.03em] text-foreground md:text-[2.25rem]">
            Your organization&apos;s{" "}
            <span className={accent.text}>intelligence layer</span>
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            Upload PDFs, process them into searchable chunks, and power AI Employees
            with grounded knowledge.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-6 lg:gap-8">
          {heroStats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl border",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <Icon className={cn("size-4", accent.text)} />
              </div>
              <div>
                <p className="font-display text-xl leading-none tracking-[-0.02em] text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-[12px] text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {canUpload && (
          <Button variant="brand" size="sm" onClick={onUploadClick}>
            <Upload className="size-3.5" />
            Upload document
          </Button>
        )}
        <p className="text-[12px] text-tertiary">
          PDF only · Max 25 MB · Process → Chunk → Embed pipeline
        </p>
      </div>
    </section>
  );
}
