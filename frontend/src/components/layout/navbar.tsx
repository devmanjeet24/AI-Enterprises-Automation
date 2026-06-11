"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import { Container } from "./container";

function Navbar() {
  const { mobileMenuOpen, setMobileMenuOpen, toggleMobileMenu } = useUiStore();

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-6">
      <Container>
        <nav
          className="glass flex h-[52px] items-center justify-between rounded-full px-4 md:px-6"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="text-sm font-medium tracking-tight text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            {siteConfig.name}
            <span className="text-muted-foreground">.ai</span>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href={siteConfig.links.login}>Sign in</Link>
            </Button>
            <Button variant="brand" size="sm" asChild>
              <Link href={siteConfig.links.demo}>Book a demo</Link>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:hidden"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </nav>

        <div
          className={cn(
            "glass mt-3 overflow-hidden rounded-2xl transition-all duration-300 md:hidden",
            mobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 pointer-events-none",
          )}
        >
          <ul className="flex flex-col gap-1 p-3">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Button variant="ghost" className="w-full justify-center" asChild>
                <Link
                  href={siteConfig.links.login}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </Button>
              <Button variant="brand" className="w-full justify-center" asChild>
                <Link
                  href={siteConfig.links.demo}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book a demo
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      </Container>
    </header>
  );
}

export { Navbar };
