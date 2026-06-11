import { FeatureSection } from "./feature-section";

export function WorkflowAutomationSection() {
  return (
    <FeatureSection
      reversed
      overline="Workflow Automation"
      title="Deterministic workflows with"
      accent="enterprise control."
      description="Chain steps, add approval gates, and run workflows on schedule or on demand—with complete execution logs."
      bullets={[
        "Visual step builder with branching logic",
        "Human-in-the-loop approval steps",
        "Execution history with per-step outputs",
        "Integrate AI employees into workflow steps",
      ]}
      mockVariant="workflow"
    />
  );
}
