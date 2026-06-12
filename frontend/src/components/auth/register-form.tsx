"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import { getApiErrorMessage } from "@/lib/api/errors";
import { registerAndEstablishSession } from "@/lib/auth/session";
import {
  hasFieldErrors,
  validateRegisterForm,
  type FieldErrors,
  type RegisterFormValues,
} from "@/lib/auth/validation";
import { useAppDispatch } from "@/store/hooks";

const initialValues: RegisterFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  organization_name: "",
};

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
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

    const validationErrors = validateRegisterForm(values);
    if (hasFieldErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await registerAndEstablishSession(dispatch, {
        email: values.email.trim(),
        password: values.password.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        organization_name: values.organization_name.trim(),
      });
      router.replace("/overview");
    } catch (error) {
      setErrors({
        form: getApiErrorMessage(error, "Unable to create account. Please try again."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}

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
              value={values.first_name}
              onChange={(event) => updateField("first_name", event.target.value)}
              aria-invalid={Boolean(errors.first_name)}
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name}</p>
            )}
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
              value={values.last_name}
              onChange={(event) => updateField("last_name", event.target.value)}
              aria-invalid={Boolean(errors.last_name)}
            />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name}</p>
            )}
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
            value={values.organization_name}
            onChange={(event) => updateField("organization_name", event.target.value)}
            aria-invalid={Boolean(errors.organization_name)}
          />
          {errors.organization_name && (
            <p className="text-xs text-destructive">{errors.organization_name}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="brand"
          className="!mt-6 h-11 w-full rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account…" : "Create account"}
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
