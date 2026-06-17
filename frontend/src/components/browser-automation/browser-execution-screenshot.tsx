"use client";

import { ImageOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuthToken } from "@/hooks/use-auth-token";
import { siteConfig } from "@/config/site";
import { getBrowserExecutionScreenshotUrl } from "@/lib/api/browser-tasks";

interface BrowserExecutionScreenshotProps {
  executionId: string;
  hasScreenshot?: boolean;
  compact?: boolean;
}

export function BrowserExecutionScreenshot({
  executionId,
  hasScreenshot = true,
  compact = false,
}: BrowserExecutionScreenshotProps) {
  const token = useAuthToken();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const hasScreenshotFlag = hasScreenshot;

  useEffect(() => {
    if (!hasScreenshotFlag || !token) {
      setImageUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const loadScreenshot = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetch(
          `${siteConfig.apiUrl}${getBrowserExecutionScreenshotUrl(executionId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!response.ok) {
          throw new Error("Failed to load screenshot");
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setImageUrl(objectUrl);
        }
      } catch {
        if (active) {
          setHasError(true);
          setImageUrl(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadScreenshot();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [executionId, hasScreenshotFlag, token]);

  if (!hasScreenshotFlag) {
    return null;
  }

  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-tertiary">
        Failure screenshot
      </p>
      <div
        className={
          compact
            ? "mt-2 overflow-hidden rounded-lg border border-white/[0.08] bg-black/20"
            : "mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20"
        }
      >
        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading screenshot…
          </div>
        )}
        {!isLoading && hasError && (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-[13px] text-muted-foreground">
            <ImageOff className="size-4" />
            Screenshot unavailable
          </div>
        )}
        {!isLoading && imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Failure screenshot for execution ${executionId.slice(0, 8)}`}
            className={compact ? "h-24 w-full object-cover object-top" : "w-full object-contain"}
          />
        )}
      </div>
    </div>
  );
}
