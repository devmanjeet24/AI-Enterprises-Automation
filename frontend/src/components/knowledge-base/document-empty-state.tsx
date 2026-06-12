import { BookOpen, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { cn } from "@/lib/utils";

interface DocumentEmptyStateProps {
  canUpload?: boolean;
  onUploadClick?: () => void;
}

export function DocumentEmptyState({
  canUpload = true,
  onUploadClick,
}: DocumentEmptyStateProps) {
  const accent = dashboardAccents.purple;

  return (
    <DashboardCard
      variant="panel"
      accent="purple"
      interactive={false}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl border",
          accent.bgSubtle,
          accent.border,
        )}
      >
        <BookOpen className={cn("size-6", accent.text)} />
      </div>
      <h3 className="mt-5 text-[16px] font-medium tracking-[-0.01em] text-foreground">
        No documents yet
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        Upload PDF files to build your organization&apos;s knowledge base. Documents
        can be assigned to AI Employees once processed and embedded.
      </p>
      {canUpload && (
        <Button variant="brand" size="sm" className="mt-6" onClick={onUploadClick}>
          <Upload className="size-3.5" />
          Upload your first document
        </Button>
      )}
    </DashboardCard>
  );
}
