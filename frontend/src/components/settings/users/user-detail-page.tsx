"use client";

import { notFound } from "next/navigation";

import { useUser } from "@/hooks/use-users";
import { useUserPermissions } from "@/hooks/use-auth-token";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { isAccessDeniedError } from "@/lib/users/access";

import { UsersAccessDenied } from "./users-access-denied";
import { UsersError } from "./users-error";
import { UserDetailSkeleton } from "./users-skeleton";
import { UserActions } from "./user-actions";
import { UserHeader } from "./user-header";
import { UserProfilePanel } from "./user-profile-panel";
import { UserRolesPanel } from "./user-roles-panel";

interface UserDetailPageProps {
  userId: string;
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
  const permissions = useUserPermissions();

  const canWrite = hasPermission(permissions, PERMISSIONS.USERS_WRITE);
  const canAssignRole = hasPermission(permissions, PERMISSIONS.USERS_ASSIGN_ROLE);

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useUser(userId);

  if (isLoading) {
    return (
      <div className="px-6 py-8 md:px-8">
        <UserDetailSkeleton />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (isAccessDeniedError(error)) {
      return (
        <div className="px-6 py-8 md:px-8">
          <UsersAccessDenied message="You do not have permission to view this user." />
        </div>
      );
    }
    return (
      <div className="px-6 py-8 md:px-8">
        <UsersError
          title="Failed to load user"
          message={getApiErrorMessage(error, "Could not load this user.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!user) notFound();

  return (
    <div className="pb-10 md:pb-12">
      <UserHeader
        user={user}
        actions={
          <UserActions user={user} canWrite={canWrite} />
        }
      />

      <div className="mt-8 space-y-6 px-6 md:mt-10 md:px-8">
        <UserProfilePanel user={user} canWrite={canWrite} />
        <UserRolesPanel user={user} canAssignRole={canAssignRole} />
      </div>
    </div>
  );
}
