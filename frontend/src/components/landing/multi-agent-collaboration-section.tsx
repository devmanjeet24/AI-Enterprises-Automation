import { FeatureSection } from "./feature-section";

export function MultiAgentCollaborationSection() {
  return (
    <FeatureSection
      id="solutions"
      overline="Multi-Agent Collaboration"
      title="Specialized agents that"
      accent="work together."
      description="Compose agent teams where each member handles a distinct capability—research, analysis, writing, and review."
      bullets={[
        "Define teams with specialized agent roles",
        "Task queue with execution history and status",
        "Agents collaborate on complex multi-step work",
        "Full visibility into each agent's contribution",
      ]}
      mockVariant="agents"
    />
  );
}
