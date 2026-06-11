import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Lumen account and start building AI employees.",
};

export default function RegisterPage() {
  return <AuthShell />;
}
