import type { Metadata } from "next";

import { UserDetailPage } from "@/components/settings/users";
import { siteConfig } from "@/config/site";

interface UserDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `User · Settings · ${siteConfig.name}`,
    description: "User profile, role assignments, and account status.",
  };
}

export default async function UserDetailRoute({ params }: UserDetailRouteProps) {
  const { id } = await params;
  return <UserDetailPage userId={id} />;
}
