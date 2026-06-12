import { FeatureSection } from "./feature-section";

export function BrowserAutomationSection() {
  return (
    <FeatureSection
      reversed
      overline="Browser Automation"
      title="Web tasks executed with"
      accent="managed profiles."
      description="Automate browser interactions with persistent profiles, execution tracking, and screenshot capture."
      bullets={[
        "Managed browser profiles per organization",
        "Define tasks with structured input payloads",
        "Execution history with status and screenshots",
        "Secure credential handling for web portals",
      ]}
      mockVariant="browser"
    />
  );
}
