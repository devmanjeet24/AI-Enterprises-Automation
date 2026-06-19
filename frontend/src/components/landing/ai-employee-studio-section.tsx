import { AiEmployeeStudioVisual } from "./ai-employee-studio-visual";
import { FeatureSection } from "./feature-section";

export function AiEmployeeStudioSection() {
  return (
    <FeatureSection
      overline="AI Employee Studio"
      title="Build AI employees that"
      accent="work like your team."
      description="Define roles, assign tools, set guardrails, and deploy AI employees across departments—with full auditability."
      bullets={[
        "Role-based personas with department context",
        "Tool access controls and permission boundaries",
        "Conversation history with grounded responses",
        "Deploy to support, sales, and operations teams",
      ]}
      visual={<AiEmployeeStudioVisual />}
    />
  );
}
