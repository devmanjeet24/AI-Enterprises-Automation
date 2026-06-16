"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";
import { useAcceptUserInvitation } from "@/hooks/use-users";
import { getApiErrorMessage } from "@/lib/api/errors";
import { establishSession } from "@/lib/auth/session";
import { useAppDispatch } from "@/store/hooks";

const initialValues = {
  first_name: "",
  last_name: "",
  password: "",
};

export function AcceptInvitationForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const acceptMutation = useAcceptUserInvitation();
  const token = searchParams.get("token")?.trim() ?? "";
  const [values, setValues] = useState(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof initialValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Invitation token is missing. Ask your admin to resend the invitation.");
      return;
    }

    try {
      const response = await acceptMutation.mutateAsync({
        token,
        password: values.password.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
      });
      await establishSession(dispatch, response.access_token);
      router.replace("/overview");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to accept invitation."));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-display text-[1.75rem] leading-[1.2] tracking-[-0.03em] text-foreground lg:text-[2rem]">
          Accept invitation
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Create your account and join your organization workspace.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-[13px] text-muted-foreground">
              First name
            </Label>
            <Input
              id="first_name"
              value={values.first_name}
              onChange={(event) => update("first_name", event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-[13px] text-muted-foreground">
              Last name
            </Label>
            <Input
              id="last_name"
              value={values.last_name}
              onChange={(event) => update("last_name", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="pr-11"
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
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

        <Button
          type="submit"
          variant="brand"
          className="!mt-6 h-11 w-full rounded-xl"
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Accept invitation
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
