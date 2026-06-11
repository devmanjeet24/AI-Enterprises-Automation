import {
  AiEmployeeStudioSection,
  AnalyticsSection,
  BrowserAutomationSection,
  BusinessResearchHubSection,
  CtaSection,
  HeroSection,
  KnowledgeIntelligenceSection,
  MultiAgentCollaborationSection,
  PlatformOverviewSection,
  PricingSection,
  TestimonialsSection,
  TrustedBySection,
  WorkflowAutomationSection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      {/* <TrustedBySection /> */}
      <PlatformOverviewSection />
      <AiEmployeeStudioSection />
      <KnowledgeIntelligenceSection />
      <MultiAgentCollaborationSection />
      <WorkflowAutomationSection />
      <BusinessResearchHubSection />
      <BrowserAutomationSection />
      <AnalyticsSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
    </>
  );
}
