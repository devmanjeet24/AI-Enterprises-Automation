"use client";

import type { User } from "@/lib/users/types";

import { UserCard } from "./user-card";

interface UserCardGridProps {
  users: User[];
}

export function UserCardGrid({ users }: UserCardGridProps) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No users match this filter.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
