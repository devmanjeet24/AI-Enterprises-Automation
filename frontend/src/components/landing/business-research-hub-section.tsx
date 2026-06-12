import { FeatureSection } from "./feature-section";

export function BusinessResearchHubSection() {
  return (
    <FeatureSection
      overline="Business Research Hub"
      title="Structured research that"
      accent="delivers reports."
      description="Launch research projects with templates, gather findings from multiple sources, and export polished reports."
      bullets={[
        "Pre-built research templates for common use cases",
        "Multi-phase projects: plan, gather, synthesize",
        "Sourced findings with export to PDF and Markdown",
        "Analytics on research project performance",
      ]}
      mockVariant="research"
    />
  );
}
