import type { Metadata } from "next";

import { DepartmentDetailPage } from "@/components/settings/departments";
import { siteConfig } from "@/config/site";

interface DepartmentDetailRouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Department · Settings · ${siteConfig.name}`,
    description: "Department profile, status, and linked org teams.",
  };
}

export default async function DepartmentDetailRoute({ params }: DepartmentDetailRouteProps) {
  const { id } = await params;
  return <DepartmentDetailPage departmentId={id} />;
}
