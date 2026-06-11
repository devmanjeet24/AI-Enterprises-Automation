"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setMobileMenuOpen,
  toggleMobileMenu,
} from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";

import { Container } from "./container";

const navLinkClass =
  "text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200";

function Navbar() {
  const dispatch = useAppDispatch();
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-5 md:pt-6">
      <Container>
        <nav
          className="glass-light relative grid h-[52px] w-full grid-cols-[1fr_auto_1fr] items-center rounded-full px-4 md:h-14 md:px-5"
          aria-label="Main navigation"
        >
          {/* Left — nav links (desktop) */}
          <ul className="hidden items-center gap-7 lg:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(navLinkClass, "text-[#0a0f1a]/85 hover:text-[#0a0f1a]")}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Center — logo */}
          <Link
            href="/"
            className="justify-self-center text-sm font-semibold tracking-[-0.02em] text-[#0a0f1a] lg:text-[15px]"
            onClick={() => dispatch(setMobileMenuOpen(false))}
          >
            {siteConfig.name}
            <span className="font-normal text-[#0a0f1a]/55">.ai</span>
          </Link>

          {/* Right — auth CTAs (desktop) */}
          <div className="hidden items-center justify-end gap-2.5 lg:flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-[13px] font-medium text-[#0a0f1a] hover:bg-[#0a0f1a]/6 hover:text-[#0a0f1a]"
              asChild
            >
              <Link href={siteConfig.links.login}>Sign In</Link>
            </Button>
            <Button variant="brand" size="sm" className="text-[13px] font-medium" asChild>
              <Link href={siteConfig.links.register}>Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="col-start-3 justify-self-end inline-flex size-9 items-center justify-center rounded-full text-[#0a0f1a] transition-colors hover:bg-[#0a0f1a]/6 lg:hidden"
            onClick={() => dispatch(toggleMobileMenu())}
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

        {/* Mobile dropdown */}
        <div
          className={cn(
            "glass-light mt-3 overflow-hidden rounded-2xl transition-all duration-300 lg:hidden",
            mobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 pointer-events-none",
          )}
        >
          <ul className="flex flex-col gap-0.5 p-3">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-[#0a0f1a]/85 transition-colors hover:bg-[#0a0f1a]/5 hover:text-[#0a0f1a]"
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-[#0a0f1a]/10 pt-3">
              <Button
                variant="ghost"
                className="w-full justify-center font-medium text-[#0a0f1a] hover:bg-[#0a0f1a]/5"
                asChild
              >
                <Link
                  href={siteConfig.links.login}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                >
                  Sign In
                </Link>
              </Button>
              <Button variant="brand" className="w-full justify-center font-medium" asChild>
                <Link
                  href={siteConfig.links.register}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                >
                  Get Started
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
