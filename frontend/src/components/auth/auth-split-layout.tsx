import Link from "next/link";

import { AuthBackground } from "@/components/auth/auth-background";
import { AuthImagePanel } from "@/components/auth/auth-image-panel";
import { siteConfig } from "@/config/site";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="relative isolate min-h-screen">
      <AuthBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-[1040px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c1220]/90 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex flex-row">
            {/* Left — form (55%) */}
            <div className="flex w-[55%] flex-col justify-center px-9 py-11 sm:px-11 sm:py-12 lg:px-14 lg:py-14">
              <div className="mb-8 flex items-center justify-between gap-4">
                <Link
                  href="/"
                  className="text-sm font-semibold tracking-[-0.02em] text-foreground transition-opacity hover:opacity-80"
                >
                  {siteConfig.name}
                  <span className="font-normal text-muted-foreground">.ai</span>
                </Link>
                <Link
                  href="/"
                  className="shrink-0 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to home
                </Link>
              </div>

              {children}
            </div>

            {/* Right — image panel (45%) */}
            <div className="relative w-[45%] overflow-hidden border-l border-white/[0.06]">
              <div
                className="pointer-events-none absolute inset-0 z-10"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(59, 91, 168, 0.14) 0%, transparent 70%)",
                }}
              />
              <AuthImagePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
