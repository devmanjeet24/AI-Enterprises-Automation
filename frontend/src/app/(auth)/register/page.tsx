import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Lumen account and start building AI employees.",
};

export default function RegisterPage() {
  return (
    <AuthSplitLayout>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
