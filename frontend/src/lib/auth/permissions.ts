export const PERMISSIONS = {
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
} as const;

export function hasPermission(
  permissions: string[] | undefined,
  slug: string,
): boolean {
  return permissions?.includes(slug) ?? false;
}
