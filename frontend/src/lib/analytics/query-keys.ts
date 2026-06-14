export const analyticsKeys = {
  all: ["analytics"] as const,
  executive: () => [...analyticsKeys.all, "executive"] as const,
  organization: () => [...analyticsKeys.all, "organization"] as const,
  knowledge: () => [...analyticsKeys.all, "knowledge"] as const,
  agentTeams: () => [...analyticsKeys.all, "agent-teams"] as const,
  workflows: () => [...analyticsKeys.all, "workflows"] as const,
  aiEmployees: () => [...analyticsKeys.all, "ai-employees"] as const,
  reports: () => [...analyticsKeys.all, "reports"] as const,
};
