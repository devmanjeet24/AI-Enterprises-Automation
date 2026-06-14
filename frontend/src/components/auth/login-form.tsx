"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import { getApiErrorMessage } from "@/lib/api/errors";
import { loginAndEstablishSession, resolvePostLoginPath } from "@/lib/auth/session";
import {
  hasFieldErrors,
  validateLoginForm,
  type FieldErrors,
  type LoginFormValues,
} from "@/lib/auth/validation";
import { useAppDispatch } from "@/store/hooks";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);
    if (hasFieldErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await loginAndEstablishSession(
        dispatch,
        values.email.trim(),
        values.password.trim(),
      );
      router.replace(resolvePostLoginPath(searchParams.get("from")));
    } catch (error) {
      setErrors({ form: getApiErrorMessage(error, "Unable to sign in. Please try again.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-[1.75rem] leading-[1.2] tracking-[-0.03em] text-foreground lg:text-[2rem]">
          Welcome back
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Sign in to your enterprise AI workspace
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}

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
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
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
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pr-11"
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              aria-invalid={Boolean(errors.password)}
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="brand"
          className="!mt-6 h-11 w-full rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={siteConfig.links.register}
          className="font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Get started
        </Link>
      </p>
    </div>
  );
}
