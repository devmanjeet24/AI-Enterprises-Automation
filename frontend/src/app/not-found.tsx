import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-tertiary">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.03em] text-foreground md:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you requested does not exist or may have been moved. Return to
        your workspace or the {siteConfig.name} home page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="brand" size="sm" asChild>
          <Link href="/overview">
            <Home className="size-3.5" />
            Go to overview
          </Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
