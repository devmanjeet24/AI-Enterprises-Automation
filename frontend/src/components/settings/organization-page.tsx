"use client";

import { useUserPermissions } from "@/hooks/use-auth-token";
import { useOrganization } from "@/hooks/use-settings";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/settings/access";

import { OrganizationSettingsPanel } from "./organization-settings-panel";
import { SettingsAccessDenied } from "./settings-access-denied";
import { SettingsError } from "./settings-error";
import { SettingsLayout } from "./settings-layout";
import { OrganizationPageSkeleton } from "./settings-skeleton";

export function OrganizationPage() {
  const permissions = useUserPermissions();
  const canWrite = hasPermission(permissions, PERMISSIONS.ORGANIZATIONS_WRITE);

  const {
    data: organization,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrganization();

  if (isLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <OrganizationPageSkeleton />
      </div>
    );
  }

  if (isError) {
    if (isAccessDeniedError(error)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <SettingsAccessDenied message="You do not have permission to view organization settings." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <SettingsError
          title="Failed to load organization"
          message={getApiErrorMessage(error, "Could not load organization settings.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="px-6 py-8 md:px-8">
        <SettingsError
          title="Organization unavailable"
          message="Could not load organization settings."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <SettingsLayout
      eyebrow="Organization"
      title={organization.name}
      description="Company profile and workspace identity for your tenant."
    >
      <OrganizationSettingsPanel organization={organization} canWrite={canWrite} />
    </SettingsLayout>
  );
}
