import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Lumen account.",
};

export default function LoginPage() {
  return <AuthShell />;
}
