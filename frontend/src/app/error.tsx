"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.03em] text-foreground md:text-4xl">
        Unexpected error
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        An unexpected error occurred while loading this page. You can try again or
        return to a safe page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="brand" size="sm" onClick={() => reset()}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/overview">Go to overview</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
