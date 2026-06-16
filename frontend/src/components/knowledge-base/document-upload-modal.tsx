"use client";

import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentTypeOptions } from "@/config/knowledge-base";
import { useUploadDocument } from "@/hooks/use-knowledge-base";
import { runMutationWithFeedback } from "@/lib/mutation-feedback";
import { dashboardAccents } from "@/lib/dashboard-accents";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentUploadModal({ open, onClose }: DocumentUploadModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accent = dashboardAccents.purple;
  const toast = useToast();
  const uploadMutation = useUploadDocument();

  const resetForm = useCallback(() => {
    setTitle("");
    setDocumentType("");
    setSelectedFile(null);
    setFileError(null);
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !uploadMutation.isPending) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, uploadMutation.isPending]);

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    resetForm();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Only PDF files are supported.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "File must be 25 MB or smaller.";
    }
    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    handleFileSelect(file ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await runMutationWithFeedback({
      action: () =>
        uploadMutation.mutateAsync({
          file: selectedFile,
          title: title.trim() || undefined,
          document_type: documentType || undefined,
        }),
      toast,
      successMessage: (document) =>
        `Document "${document.title}" uploaded. Run Process on the next screen.`,
      errorFallback: "Failed to upload document.",
      onSuccess: (document) => {
        resetForm();
        onClose();
        router.push(`/knowledge-base/${document.id}`);
      },
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close upload modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        disabled={uploadMutation.isPending}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0c1220]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(167,139,250,0.4) 50%, transparent)",
          }}
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Knowledge Base
            </p>
            <h2
              id="upload-modal-title"
              className="mt-1 text-lg font-medium tracking-[-0.02em] text-foreground"
            >
              Upload document
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              PDF only · Max 25 MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div
          className={cn(
            "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
            isDragging
              ? cn(accent.border, accent.bgSubtle)
              : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.03]",
            fileError && "border-destructive/40",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={uploadMutation.isPending}
            onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
          />
          {selectedFile ? (
            <>
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl border",
                  accent.bgSubtle,
                  accent.border,
                )}
              >
                <FileText className={cn("size-5", accent.text)} />
              </div>
              <p className="mt-3 text-[14px] font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                type="button"
                className="mt-3 text-[12px] font-medium text-brand hover:text-brand-hover"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedFile(null);
                  setFileError(null);
                }}
                disabled={uploadMutation.isPending}
              >
                Choose a different file
              </button>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <Upload className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-[14px] font-medium text-foreground">
                Drag & drop your PDF here
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                or click to browse files
              </p>
            </>
          )}
        </div>

        {fileError && (
          <p className="mt-2 text-[12px] text-destructive">{fileError}</p>
        )}

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. Employee Handbook 2025"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={uploadMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-type">Document type</Label>
            <select
              id="doc-type"
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              disabled={uploadMutation.isPending}
              className={cn(
                "flex h-11 w-full rounded-xl border border-border bg-white/[0.04] px-4 text-sm text-foreground transition-colors",
                "focus-visible:border-border-strong focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">Select a category (optional)</option>
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled={!selectedFile || uploadMutation.isPending}
            onClick={handleUpload}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            {uploadMutation.isPending ? "Uploading…" : "Upload document"}
          </Button>
        </div>
      </div>
    </div>
  );
}
