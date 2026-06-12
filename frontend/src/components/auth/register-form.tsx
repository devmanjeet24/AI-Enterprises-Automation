"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-[1.75rem] leading-[1.2] tracking-[-0.03em] text-foreground lg:text-[2rem]">
          Create your account
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Start building with enterprise AI automation
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-[13px] text-muted-foreground">
              First name
            </Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              placeholder="Jane"
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-[13px] text-muted-foreground">
              Last name
            </Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              placeholder="Smith"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organization_name" className="text-[13px] text-muted-foreground">
            Company / Organization name
          </Label>
          <Input
            id="organization_name"
            name="organization_name"
            type="text"
            placeholder="Acme Corp"
            autoComplete="organization"
          />
        </div>

        <Button type="submit" variant="brand" className="!mt-6 h-11 w-full rounded-xl">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={siteConfig.links.login}
          className="font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
