import type { Metadata } from "next";
import { Suspense } from "react";

import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Accept your organization invitation and create your Lumen account.",
};

export default function AcceptInvitationPage() {
  return (
    <AuthSplitLayout>
      <Suspense fallback={null}>
        <AcceptInvitationForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
