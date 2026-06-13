"use client";

import type { Role } from "@/lib/roles/types";

import { RoleCard } from "./role-card";

interface RoleCardGridProps {
  roles: Role[];
}

export function RoleCardGrid({ roles }: RoleCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} />
      ))}
    </div>
  );
}
