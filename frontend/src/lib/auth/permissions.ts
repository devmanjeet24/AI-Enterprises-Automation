export const PERMISSIONS = {
  ORGANIZATIONS_READ: "organizations:read",
  ORGANIZATIONS_WRITE: "organizations:write",
  DEPARTMENTS_READ: "departments:read",
  DEPARTMENTS_WRITE: "departments:write",
  DEPARTMENTS_DELETE: "departments:delete",
  TEAMS_READ: "teams:read",
  TEAMS_WRITE: "teams:write",
  TEAMS_DELETE: "teams:delete",
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_ASSIGN_ROLE: "users:assign-role",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  ROLES_DELETE: "roles:delete",
  PERMISSIONS_READ: "permissions:read",
  PERMISSIONS_WRITE: "permissions:write",
  PERMISSIONS_DELETE: "permissions:delete",
  PERMISSIONS_ASSIGN: "permissions:assign",
  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_WRITE: "documents:write",
  DOCUMENTS_DELETE: "documents:delete",
  KNOWLEDGE_QUERY: "knowledge:query",
  EMPLOYEES_READ: "employees:read",
  EMPLOYEES_WRITE: "employees:write",
  EMPLOYEES_DELETE: "employees:delete",
  EMPLOYEES_CHAT: "employees:chat",
  AGENT_TEAMS_READ: "agent_teams:read",
  AGENT_TEAMS_WRITE: "agent_teams:write",
  AGENT_TEAMS_DELETE: "agent_teams:delete",
  AGENT_TEAMS_EXECUTE: "agent_teams:execute",
  WORKFLOWS_READ: "workflows:read",
  WORKFLOWS_WRITE: "workflows:write",
  WORKFLOWS_DELETE: "workflows:delete",
  RESEARCH_PROJECTS_READ: "research_projects:read",
  RESEARCH_PROJECTS_WRITE: "research_projects:write",
  RESEARCH_PROJECTS_EXECUTE: "research_projects:execute",
  RESEARCH_PROJECTS_DELETE: "research_projects:delete",
  BROWSER_PROFILES_READ: "browser_profiles:read",
  BROWSER_PROFILES_WRITE: "browser_profiles:write",
  BROWSER_PROFILES_DELETE: "browser_profiles:delete",
  BROWSER_TASKS_READ: "browser_tasks:read",
  BROWSER_TASKS_WRITE: "browser_tasks:write",
  BROWSER_TASKS_DELETE: "browser_tasks:delete",
  BROWSER_TASKS_EXECUTE: "browser_tasks:execute",
  SUPPORT_CATEGORIES_READ: "support_categories:read",
  SUPPORT_CATEGORIES_WRITE: "support_categories:write",
  SUPPORT_CATEGORIES_DELETE: "support_categories:delete",
  SUPPORT_TICKETS_READ: "support_tickets:read",
  SUPPORT_TICKETS_WRITE: "support_tickets:write",
  SUPPORT_TICKETS_DELETE: "support_tickets:delete",
  SUPPORT_TICKETS_EXECUTE: "support_tickets:execute",
  VOICE_AGENTS_READ: "voice_agents:read",
  VOICE_AGENTS_WRITE: "voice_agents:write",
  VOICE_AGENTS_DELETE: "voice_agents:delete",
  VOICE_SESSIONS_READ: "voice_sessions:read",
  VOICE_SESSIONS_WRITE: "voice_sessions:write",
  VOICE_SESSIONS_DELETE: "voice_sessions:delete",
  VOICE_SESSIONS_EXECUTE: "voice_sessions:execute",
  OMNICHANNEL_CHANNELS_READ: "omnichannel_channels:read",
  OMNICHANNEL_CHANNELS_WRITE: "omnichannel_channels:write",
  OMNICHANNEL_CHANNELS_DELETE: "omnichannel_channels:delete",
  OMNICHANNEL_CONVERSATIONS_READ: "omnichannel_conversations:read",
  OMNICHANNEL_CONVERSATIONS_WRITE: "omnichannel_conversations:write",
  OMNICHANNEL_CONVERSATIONS_DELETE: "omnichannel_conversations:delete",
  OMNICHANNEL_CONVERSATIONS_EXECUTE: "omnichannel_conversations:execute",
} as const;

export function hasPermission(
  permissions: string[] | undefined,
  slug: string,
): boolean {
  return permissions?.includes(slug) ?? false;
}

/** Upload/record in a voice session — write or execute permission is sufficient. */
export function canSendVoiceMessages(
  permissions: string[] | undefined,
  roles?: ReadonlyArray<{ slug: string }>,
): boolean {
  if (
    hasPermission(permissions, PERMISSIONS.VOICE_SESSIONS_EXECUTE) ||
    hasPermission(permissions, PERMISSIONS.VOICE_SESSIONS_WRITE)
  ) {
    return true;
  }

  // Fallback when JWT /me permissions are stale after migrations (admin/manager only).
  return (
    roles?.some((role) => role.slug === "admin" || role.slug === "manager") ?? false
  );
}

/** Delete a voice conversation — delete permission or admin/manager. */
export function canDeleteVoiceSessions(
  permissions: string[] | undefined,
  roles?: ReadonlyArray<{ slug: string }>,
): boolean {
  if (hasPermission(permissions, PERMISSIONS.VOICE_SESSIONS_DELETE)) {
    return true;
  }

  return (
    roles?.some((role) => role.slug === "admin" || role.slug === "manager") ?? false
  );
}
